import type { PageServerLoad } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { resolveHouseholdId, getHouseholdInfo, listHouseholdMembers } from '$lib/server/household';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	await connectMongoose();
	const householdId = await resolveHouseholdId(session!.user!.id!, session!.user!.name);

	const [household, members] = await Promise.all([
		getHouseholdInfo(householdId),
		listHouseholdMembers(householdId)
	]);

	return {
		household: { name: household!.name, inviteCode: household!.inviteCode },
		members
	};
};
