import type { PageServerLoad } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';
import { resolveHouseholdId } from '$lib/server/household';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	await connectMongoose();
	const householdId = await resolveHouseholdId(session!.user!.id!, session!.user!.name);

	const recipes = await Recipe.find({ householdId })
		.select('title description prepTime tags nutrition imageUrl ingredients')
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
