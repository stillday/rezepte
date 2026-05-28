import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';
import mongoose, { isValidObjectId } from 'mongoose';

const ALLOWED_FIELDS = ['title', 'description', 'servings', 'prepTime', 'ingredients', 'steps', 'tags', 'nutrition', 'sourceUrl', 'imageUrl'] as const;

function sanitizeHttpUrl(url: unknown): string | undefined {
	if (typeof url !== 'string') return undefined;
	try {
		const u = new URL(url);
		return ['http:', 'https:'].includes(u.protocol) ? url : undefined;
	} catch {
		return undefined;
	}
}

function pickAllowed(body: Record<string, unknown>) {
	const clean = Object.fromEntries(
		Object.entries(body).filter(([k]) => (ALLOWED_FIELDS as readonly string[]).includes(k))
	);
	if ('sourceUrl' in clean) clean.sourceUrl = sanitizeHttpUrl(clean.sourceUrl);
	if ('imageUrl' in clean) clean.imageUrl = sanitizeHttpUrl(clean.imageUrl);
	return clean;
}

export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');
	if (!isValidObjectId(event.params.id)) throw error(400, 'Ungültige ID');

	await connectMongoose();
	try {
		const recipe = await Recipe.findOne({ _id: event.params.id, userId: session.user.id }).lean();
		if (!recipe) throw error(404, 'Nicht gefunden');
		return json({ ...recipe, id: recipe._id.toString(), _id: undefined });
	} catch (e) {
		if (e instanceof mongoose.Error.CastError) throw error(400, 'Ungültige ID');
		throw e;
	}
};

export const PUT: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');
	if (!isValidObjectId(event.params.id)) throw error(400, 'Ungültige ID');

	const body = await event.request.json();
	await connectMongoose();

	try {
		const recipe = await Recipe.findOneAndUpdate(
			{ _id: event.params.id, userId: session.user.id },
			{ $set: pickAllowed(body) },
			{ new: true }
		).lean();
		if (!recipe) throw error(404, 'Nicht gefunden');
		return json({ id: recipe._id.toString() });
	} catch (e) {
		if (e instanceof mongoose.Error.CastError) throw error(400, 'Ungültige ID');
		throw e;
	}
};

export const DELETE: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');
	if (!isValidObjectId(event.params.id)) throw error(400, 'Ungültige ID');

	await connectMongoose();
	try {
		const result = await Recipe.deleteOne({ _id: event.params.id, userId: session.user.id });
		if (result.deletedCount === 0) throw error(404, 'Nicht gefunden');
		return json({ ok: true });
	} catch (e) {
		if (e instanceof mongoose.Error.CastError) throw error(400, 'Ungültige ID');
		throw e;
	}
};
