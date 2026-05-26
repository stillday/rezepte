import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';

export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	await connectMongoose();
	const recipes = await Recipe.find({ userId: session.user.id })
		.sort({ createdAt: -1 })
		.lean();

	return json(recipes.map((r) => ({ ...r, id: r._id.toString(), _id: undefined })));
};

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const body = await event.request.json();
	await connectMongoose();

	const recipe = await Recipe.create({ ...body, userId: session.user.id });
	return json({ id: recipe._id.toString() }, { status: 201 });
};
