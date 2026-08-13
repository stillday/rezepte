import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';
import { Pantry } from '$lib/server/models/Pantry';
import { resolveHouseholdId } from '$lib/server/household';
import { addIngredientsToBring } from '$lib/server/bringSync';
import { scaleAmount } from '$lib/scaleAmount';
import { isValidObjectId } from 'mongoose';

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { recipeId, servings } = await event.request.json();
	if (!recipeId || !isValidObjectId(recipeId)) throw error(400, 'Ungültige recipeId');

	await connectMongoose();
	const householdId = await resolveHouseholdId(session.user.id, session.user.name);

	const [recipe, pantry] = await Promise.all([
		Recipe.findOne({ _id: recipeId, householdId }).lean(),
		Pantry.findOne({ householdId }).lean()
	]);
	if (!recipe) throw error(404, 'Rezept nicht gefunden');

	// Optional auf die gewählte Portionenzahl umrechnen (siehe Skalierung auf der Rezeptseite).
	const ratio =
		typeof servings === 'number' && recipe.servings ? servings / recipe.servings : 1;
	const ingredients = (recipe.ingredients ?? []).map((ing: { name: string; amount?: string; unit?: string }) => ({
		...ing,
		amount: ratio !== 1 ? scaleAmount(ing.amount, ratio) : ing.amount
	}));

	try {
		const result = await addIngredientsToBring(ingredients, pantry?.items ?? []);
		if (result.added === 0) return json({ added: 0, message: 'Alle Zutaten im Vorrat vorhanden' });
		return json(result);
	} catch {
		throw error(502, 'Bring! nicht erreichbar — bitte erneut versuchen');
	}
};
