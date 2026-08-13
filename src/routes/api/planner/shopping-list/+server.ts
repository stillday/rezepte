import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { WeekPlan } from '$lib/server/models/WeekPlan';
import { Recipe } from '$lib/server/models/Recipe';
import { Pantry } from '$lib/server/models/Pantry';
import { resolveHouseholdId } from '$lib/server/household';
import { addIngredientsToBring } from '$lib/server/bringSync';

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	await connectMongoose();
	const householdId = await resolveHouseholdId(session.user.id, session.user.name);

	const plan = await WeekPlan.findOne({ householdId }).lean();
	const recipeIds = [...new Set((plan?.slots ?? []).map((s: { recipeId: string }) => s.recipeId))];
	if (recipeIds.length === 0) return json({ added: 0, message: 'Wochenplan ist leer' });

	const [recipes, pantry] = await Promise.all([
		Recipe.find({ _id: { $in: recipeIds }, householdId }).lean(),
		Pantry.findOne({ householdId }).lean()
	]);
	const ingredients = recipes.flatMap((r) => r.ingredients ?? []);

	try {
		const result = await addIngredientsToBring(ingredients, pantry?.items ?? []);
		if (result.added === 0) return json({ added: 0, message: 'Alle Zutaten im Vorrat vorhanden' });
		return json(result);
	} catch {
		throw error(502, 'Bring! nicht erreichbar — bitte erneut versuchen');
	}
};
