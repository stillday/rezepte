import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';
import { Pantry } from '$lib/server/models/Pantry';
import { env } from '$env/dynamic/private';
import { isValidObjectId } from 'mongoose';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Bring = require('bring-shopping');

let bringCache: { client: unknown; expiresAt: number } | null = null;

async function getBringClient() {
	if (!env.BRING_EMAIL || !env.BRING_PASSWORD) {
		throw new Error('Bring! Zugangsdaten nicht konfiguriert');
	}
	if (bringCache && bringCache.expiresAt > Date.now()) {
		return bringCache.client;
	}
	const bring = new Bring({ mail: env.BRING_EMAIL, password: env.BRING_PASSWORD });
	await bring.login();
	bringCache = { client: bring, expiresAt: Date.now() + 30 * 60 * 1000 };
	return bring;
}

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { recipeId } = await event.request.json();
	if (!recipeId || !isValidObjectId(recipeId)) throw error(400, 'Ungültige recipeId');

	await connectMongoose();

	const [recipe, pantry] = await Promise.all([
		Recipe.findOne({ _id: recipeId, userId: session.user.id }).lean(),
		Pantry.findOne({ userId: session.user.id }).lean()
	]);

	if (!recipe) throw error(404, 'Rezept nicht gefunden');

	const pantryNames: Set<string> = new Set(
		(pantry?.items ?? []).map((i: { name: string }) => i.name.toLowerCase().trim())
	);
	const pantryArr = Array.from(pantryNames);

	const toAdd = (recipe.ingredients ?? []).filter((ing: { name: string }) => {
		const name = ing.name.toLowerCase().trim();
		return !pantryNames.has(name) && !pantryArr.some((p) => name.includes(p) || p.includes(name));
	});

	if (toAdd.length === 0) {
		return json({ added: 0, message: 'Alle Zutaten im Vorrat vorhanden' });
	}

	try {
		const bring = await getBringClient() as { loadLists: () => Promise<{ lists: { listUuid: string }[] }>; saveItem: (uuid: string, name: string, spec: string) => Promise<void> };
		const { lists } = await bring.loadLists();
		if (lists.length === 0) throw new Error('Keine Liste gefunden');

		const listUuid = env.BRING_LIST_UUID || lists[0].listUuid;

		for (const ing of toAdd) {
			const spec = [ing.amount, ing.unit]
				.filter(Boolean)
				.join(' ')
				.trim()
				.slice(0, 100);
			await bring.saveItem(listUuid, ing.name.slice(0, 100), spec);
		}

		return json({ added: toAdd.length, items: toAdd.map((i: { name: string }) => i.name) });
	} catch {
		throw error(502, 'Bring! nicht erreichbar — bitte erneut versuchen');
	}
};
