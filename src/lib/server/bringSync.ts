import { env } from '$env/dynamic/private';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Bring = require('bring-shopping');

interface BringClient {
	loadLists: () => Promise<{ lists: { listUuid: string }[] }>;
	saveItem: (uuid: string, name: string, spec: string) => Promise<void>;
}

let bringCache: { client: BringClient; expiresAt: number } | null = null;

async function getBringClient(): Promise<BringClient> {
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

export interface IngredientLike {
	name: string;
	amount?: string;
	unit?: string;
}

export interface PantryItemLike {
	name: string;
}

// Fasst Zutaten aus einem oder mehreren Rezepten zusammen, filtert bereits im Vorrat
// vorhandene Dinge heraus und legt den Rest bei Bring! an. Wird sowohl vom einzelnen
// "Zu Bring! hinzufügen"-Button als auch vom Wochenplaner (mehrere Rezepte auf einmal) genutzt.
export async function addIngredientsToBring(
	ingredients: IngredientLike[],
	pantryItems: PantryItemLike[]
): Promise<{ added: number; items: string[] }> {
	const pantryNames = new Set(pantryItems.map((i) => i.name.toLowerCase().trim()));
	const pantryArr = Array.from(pantryNames);

	const seen = new Set<string>();
	const toAdd = ingredients.filter((ing) => {
		const name = ing.name.toLowerCase().trim();
		if (!name || seen.has(name)) return false;
		if (pantryNames.has(name) || pantryArr.some((p) => name.includes(p) || p.includes(name))) return false;
		seen.add(name);
		return true;
	});

	if (toAdd.length === 0) return { added: 0, items: [] };

	const bring = await getBringClient();
	const { lists } = await bring.loadLists();
	if (lists.length === 0) throw new Error('Keine Liste gefunden');
	const listUuid = env.BRING_LIST_UUID || lists[0].listUuid;

	for (const ing of toAdd) {
		const spec = [ing.amount, ing.unit].filter(Boolean).join(' ').trim().slice(0, 100);
		await bring.saveItem(listUuid, ing.name.slice(0, 100), spec);
	}

	return { added: toAdd.length, items: toAdd.map((i) => i.name) };
}
