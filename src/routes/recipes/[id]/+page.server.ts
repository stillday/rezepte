import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	await connectMongoose();

	const recipe = await Recipe.findOne({
		_id: event.params.id,
		userId: session!.user!.id
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
