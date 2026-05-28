import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';
import mongoose from 'mongoose';

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

	await connectMongoose();
	try {
		const recipes = await Recipe.find({ userId: session.user.id })
			.sort({ createdAt: -1 })
			.lean();
		return json(recipes.map((r) => ({ ...r, id: r._id.toString(), _id: undefined })));
	} catch {
		throw error(500, 'Datenbankfehler');
	}
};

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const body = await event.request.json();
	await connectMongoose();

	try {
		const recipe = await Recipe.create({ ...pickAllowed(body), userId: session.user.id });
		return json({ id: recipe._id.toString() }, { status: 201 });
	} catch (e) {
		if (e instanceof mongoose.Error.ValidationError) throw error(400, 'Ungültige Rezeptdaten');
		throw error(500, 'Datenbankfehler');
	}
};
