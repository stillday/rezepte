import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Pantry } from '$lib/server/models/Pantry';
import { resolveHouseholdId } from '$lib/server/household';

export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	await connectMongoose();
	const householdId = await resolveHouseholdId(session.user.id, session.user.name);
	const pantry = await Pantry.findOne({ householdId }).lean();
	return json({ items: pantry?.items ?? [] });
};

export const PUT: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { items } = await event.request.json();
	await connectMongoose();

	const householdId = await resolveHouseholdId(session.user.id, session.user.name);
	await Pantry.findOneAndUpdate(
		{ householdId },
		{ $set: { items } },
		{ upsert: true }
	);

	return json({ ok: true });
};
