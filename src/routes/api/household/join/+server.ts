import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { joinHouseholdByCode } from '$lib/server/household';

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { code } = await event.request.json();
	if (!code || typeof code !== 'string') throw error(400, 'Code fehlt');

	await connectMongoose();
	try {
		const result = await joinHouseholdByCode(session.user.id, code.trim());
		return json(result);
	} catch (e) {
		if (e instanceof Error && e.message === 'not_found') throw error(404, 'Einladungscode ungültig');
		throw error(500, 'Beitritt fehlgeschlagen');
	}
};
