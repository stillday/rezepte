import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';

export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	await connectMongoose();
	const recipe = await Recipe.findOne({ _id: event.params.id, userId: session.user.id }).lean();
	if (!recipe) throw error(404, 'Nicht gefunden');

	return json({ ...recipe, id: recipe._id.toString(), _id: undefined });
};

export const PUT: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const body = await event.request.json();
	await connectMongoose();

	const recipe = await Recipe.findOneAndUpdate(
		{ _id: event.params.id, userId: session.user.id },
		{ $set: body },
		{ new: true }
	).lean();

	if (!recipe) throw error(404, 'Nicht gefunden');
	return json({ id: recipe._id.toString() });
};

export const DELETE: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	await connectMongoose();
	const result = await Recipe.deleteOne({ _id: event.params.id, userId: session.user.id });

	if (result.deletedCount === 0) throw error(404, 'Nicht gefunden');
	return json({ ok: true });
};
