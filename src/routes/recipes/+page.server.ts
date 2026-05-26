import type { PageServerLoad } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	await connectMongoose();

	const recipes = await Recipe.find({ userId: session!.user!.id })
		.select('title description prepTime tags nutrition imageUrl')
		.sort({ createdAt: -1 })
		.lean();

	return {
		recipes: recipes.map((r) => ({
			...r,
			id: r._id.toString(),
			_id: undefined
		}))
	};
};
