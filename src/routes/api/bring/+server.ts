import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';
import { Pantry } from '$lib/server/models/Pantry';
import { env } from '$env/dynamic/private';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Bring = require('bring-shopping');

async function getBringClient() {
	if (!env.BRING_EMAIL || !env.BRING_PASSWORD) {
		throw new Error('Bring! Zugangsdaten fehlen (BRING_EMAIL / BRING_PASSWORD)');
	}
	const bring = new Bring({ mail: env.BRING_EMAIL, password: env.BRING_PASSWORD });
	await bring.login();
	return bring;
}

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { recipeId } = await event.request.json();
	if (!recipeId) throw error(400, 'recipeId fehlt');

	await connectMongoose();

	const [recipe, pantry] = await Promise.all([
		Recipe.findOne({ _id: recipeId, userId: session.user.id }).lean(),
		Pantry.findOne({ userId: session.user.id }).lean()
	]);

	if (!recipe) throw error(404, 'Rezept nicht gefunden');

	const pantryNames: Set<string> = new Set(
		(pantry?.items ?? []).map((i: { name: string }) => i.name.toLowerCase().trim())
	);

	const toAdd = (recipe.ingredients ?? []).filter((ing: { name: string }) => {
		const name = ing.name.toLowerCase().trim();
		return !pantryNames.has(name) && !Array.from(pantryNames).some((p: string) => name.includes(p) || p.includes(name));
	});

	if (toAdd.length === 0) {
		return json({ added: 0, message: 'Alle Zutaten im Vorrat vorhanden' });
	}

	try {
		const bring = await getBringClient();
		const listsResponse = await bring.loadLists();
		const lists = listsResponse?.lists ?? [];

		if (lists.length === 0) throw new Error('Keine Bring! Liste gefunden');

		const listUuid = env.BRING_LIST_UUID || lists[0].listUuid;

		for (const ing of toAdd) {
			const spec = [ing.amount, ing.unit].filter(Boolean).join(' ').trim();
			await bring.saveItem(listUuid, ing.name, spec);
		}

		return json({ added: toAdd.length, items: toAdd.map((i: { name: string }) => i.name) });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Bring! Fehler';
		throw error(502, msg);
	}
};
