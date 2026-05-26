import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Pantry } from '$lib/server/models/Pantry';

export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	await connectMongoose();
	const pantry = await Pantry.findOne({ userId: session.user.id }).lean();
	return json({ items: pantry?.items ?? [] });
};

export const PUT: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { items } = await event.request.json();
	await connectMongoose();

	await Pantry.findOneAndUpdate(
		{ userId: session.user.id },
		{ $set: { items } },
		{ upsert: true }
	);

	return json({ ok: true });
};
