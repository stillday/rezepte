import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

const PROMPT = `Extrahiere das Rezept aus diesem Webseiteninhalt und gib NUR gültiges JSON zurück (kein Markdown, kein Text davor/danach):
{
  "title": "string",
  "description": "string",
  "servings": number,
  "prepTime": number (Minuten),
  "ingredients": [{"name": "string", "amount": "string", "unit": "string"}],
  "steps": ["string"],
  "tags": ["kids"|"quick"|"airfryer"|"ricecooker"|"lowcal"|"lowsugar"],
  "nutrition": {"calories": number, "fat": number, "sugar": number, "protein": number}
}
Tags nur setzen wenn wirklich passend. Nährwerte pro Portion schätzen wenn nicht vorhanden.`;

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { url } = await event.request.json();
	if (!url) throw error(400, 'URL fehlt');

	let pageText: string;
	try {
		const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
		const html = await res.text();
		pageText = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 12000);
	} catch {
		throw error(400, 'Seite konnte nicht geladen werden');
	}

	const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
	const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
	const result = await model.generateContent(`${PROMPT}\n\nInhalt:\n${pageText}`);
	const text = result.response.text();
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) throw error(422, 'Kein Rezept gefunden');

	try {
		const recipe = JSON.parse(jsonMatch[0]);
		recipe.sourceUrl = url;
		return json(recipe);
	} catch {
		throw error(422, 'Rezept konnte nicht geparst werden');
	}
};
