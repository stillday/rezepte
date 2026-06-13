// Extrahiert schema.org "Recipe" aus JSON-LD-Blöcken einer Webseite.
// Funktioniert ohne KI/API-Key — die meisten Rezeptseiten (Chefkoch, AllRecipes, …) liefern JSON-LD.

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ParsedRecipe {
	title: string;
	description: string;
	servings?: number;
	prepTime?: number;
	ingredients: { name: string; amount: string; unit: string }[];
	steps: string[];
	tags: string[];
	nutrition: { calories?: number; fat?: number; sugar?: number; protein?: number };
	imageUrl?: string;
}

function decodeEntities(s: string): string {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;|&apos;|&#x27;/gi, "'")
		.replace(/&nbsp;/g, ' ');
}

function clean(v: unknown): string {
	if (typeof v !== 'string') return '';
	return decodeEntities(v.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function toNum(v: unknown): number | undefined {
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	if (typeof v === 'string') {
		const m = v.replace(',', '.').match(/[\d.]+/);
		if (m) {
			const n = Number(m[0]);
			if (Number.isFinite(n)) return Math.round(n);
		}
	}
	return undefined;
}

/** ISO-8601-Dauer (PT1H30M) → Minuten */
function parseDuration(iso: unknown): number | undefined {
	if (typeof iso !== 'string') return undefined;
	const m = iso.match(/^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?/i);
	if (!m) return undefined;
	const total = Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
	return total > 0 ? total : undefined;
}

function parseYield(y: any): number | undefined {
	if (Array.isArray(y)) y = y.find((x) => x != null);
	return toNum(y);
}

function parseImage(img: any): string | undefined {
	if (!img) return undefined;
	if (typeof img === 'string') return img;
	if (Array.isArray(img)) return parseImage(img[0]);
	if (typeof img === 'object') return typeof img.url === 'string' ? img.url : undefined;
	return undefined;
}

const UNITS = new Set([
	'g', 'kg', 'mg', 'ml', 'l', 'el', 'tl', 'prise', 'prisen', 'stück', 'stk', 'dose', 'dosen',
	'packung', 'päckchen', 'pck', 'bund', 'zehe', 'zehen', 'tasse', 'tassen', 'cup', 'cups',
	'tbsp', 'tsp', 'oz', 'lb', 'msp', 'scheibe', 'scheiben', 'becher', 'glas'
]);

/** Leichte Heuristik: "200 g Mehl" → {amount:"200", unit:"g", name:"Mehl"} */
function parseIngredient(raw: string): { name: string; amount: string; unit: string } {
	const line = clean(raw);
	const m = line.match(/^([\d]+(?:[.,/][\d]+)?(?:\s*[-–]\s*[\d]+(?:[.,/][\d]+)?)?)\s+(\S+)?\s*(.*)$/);
	if (m) {
		const amount = m[1].trim();
		const maybeUnit = (m[2] ?? '').trim();
		const rest = (m[3] ?? '').trim();
		if (maybeUnit && UNITS.has(maybeUnit.toLowerCase().replace(/\.$/, ''))) {
			return { name: rest || maybeUnit, amount, unit: maybeUnit };
		}
		return { name: [maybeUnit, rest].filter(Boolean).join(' '), amount, unit: '' };
	}
	return { name: line, amount: '', unit: '' };
}

function parseInstructions(instr: any): string[] {
	if (!instr) return [];
	if (typeof instr === 'string') {
		return clean(instr)
			.split(/\r?\n|(?<=\.)\s+(?=[A-ZÄÖÜ])/)
			.map((s) => s.trim())
			.filter(Boolean);
	}
	if (Array.isArray(instr)) {
		const steps: string[] = [];
		for (const item of instr) {
			if (typeof item === 'string') {
				const c = clean(item);
				if (c) steps.push(c);
			} else if (item?.['@type'] === 'HowToSection' && Array.isArray(item.itemListElement)) {
				for (const step of item.itemListElement) {
					const c = clean(step?.text);
					if (c) steps.push(c);
				}
			} else if (item?.text) {
				const c = clean(item.text);
				if (c) steps.push(c);
			}
		}
		return steps;
	}
	return [];
}

function findRecipe(node: any): any {
	if (!node) return null;
	if (Array.isArray(node)) {
		for (const n of node) {
			const r = findRecipe(n);
			if (r) return r;
		}
		return null;
	}
	if (typeof node === 'object') {
		const type = node['@type'];
		const isRecipe = type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
		if (isRecipe) return node;
		if (node['@graph']) return findRecipe(node['@graph']);
	}
	return null;
}

function mapRecipe(r: any): ParsedRecipe {
	const ingredients = Array.isArray(r.recipeIngredient)
		? r.recipeIngredient.map((i: unknown) => parseIngredient(String(i))).filter((i: { name: string }) => i.name)
		: [];

	const prepTime =
		parseDuration(r.totalTime) ??
		((parseDuration(r.prepTime) ?? 0) + (parseDuration(r.cookTime) ?? 0) || undefined);

	const n = r.nutrition && typeof r.nutrition === 'object' ? r.nutrition : {};

	return {
		title: clean(r.name).slice(0, 200),
		description: clean(r.description).slice(0, 2000),
		servings: parseYield(r.recipeYield),
		prepTime,
		ingredients,
		steps: parseInstructions(r.recipeInstructions),
		tags: [],
		nutrition: {
			calories: toNum(n.calories),
			fat: toNum(n.fatContent),
			sugar: toNum(n.sugarContent),
			protein: toNum(n.proteinContent)
		},
		imageUrl: parseImage(r.image)
	};
}

/** Sucht in roher HTML nach einem JSON-LD-Recipe und gibt es im App-Format zurück (oder null). */
export function extractJsonLdRecipe(html: string): ParsedRecipe | null {
	const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
	for (const block of blocks) {
		const raw = block[1].replace(/^\s*\/\*\s*<!\[CDATA\[\s*\*\/|\/\*\s*\]\]>\s*\*\/\s*$/g, '').trim();
		let data: unknown;
		try {
			data = JSON.parse(raw);
		} catch {
			continue;
		}
		const recipe = findRecipe(data);
		if (recipe) {
			const mapped = mapRecipe(recipe);
			if (mapped.title && (mapped.ingredients.length || mapped.steps.length)) return mapped;
		}
	}
	return null;
}
