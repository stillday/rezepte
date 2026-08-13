import type { PageServerLoad } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Pantry } from '$lib/server/models/Pantry';
import { resolveHouseholdId } from '$lib/server/household';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	await connectMongoose();
	const householdId = await resolveHouseholdId(session!.user!.id!, session!.user!.name);

	const pantry = await Pantry.findOne({ householdId }).lean();
	return { items: pantry?.items ?? [] };
};
