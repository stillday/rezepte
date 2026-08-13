import type { PageServerLoad } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { WeekPlan } from '$lib/server/models/WeekPlan';
import { Recipe } from '$lib/server/models/Recipe';
import { resolveHouseholdId } from '$lib/server/household';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	await connectMongoose();
	const householdId = await resolveHouseholdId(session!.user!.id!, session!.user!.name);

	const [plan, recipes] = await Promise.all([
		WeekPlan.findOne({ householdId }).lean(),
		Recipe.find({ householdId }).select('title').sort({ title: 1 }).lean()
	]);

	return {
		slots: (plan?.slots ?? []) as { day: number; recipeId: string }[],
		recipes: recipes.map((r) => ({ id: r._id.toString(), title: r.title as string }))
	};
};
