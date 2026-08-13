import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { isValidObjectId } from 'mongoose';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';
import { resolveHouseholdId } from '$lib/server/household';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	if (!isValidObjectId(event.params.id)) throw error(404, 'Rezept nicht gefunden');

	await connectMongoose();
	const householdId = await resolveHouseholdId(session!.user!.id!, session!.user!.name);

	const recipe = await Recipe.findOne({
		_id: event.params.id,
		householdId
	}).lean();

	if (!recipe) throw error(404, 'Rezept nicht gefunden');

	return {
		recipe: {
			...recipe,
			id: recipe._id.toString(),
			_id: undefined
		}
	};
};
