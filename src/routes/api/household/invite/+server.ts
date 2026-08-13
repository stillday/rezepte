import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { resolveHouseholdId, regenerateInviteCode } from '$lib/server/household';

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	await connectMongoose();
	const householdId = await resolveHouseholdId(session.user.id, session.user.name);
	const inviteCode = await regenerateInviteCode(householdId);
	return json({ inviteCode });
};
