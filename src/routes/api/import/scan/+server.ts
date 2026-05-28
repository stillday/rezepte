import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

const PROMPT = `Lies das Rezept aus diesem Bild (Kochbuchseite oder Rezeptkarte) und gib NUR gültiges JSON zurück (kein Markdown):
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
Tags nur setzen wenn wirklich passend. Nährwerte pro Portion schätzen wenn nicht im Bild.`;

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { imageBase64, mediaType } = await event.request.json();
	if (!imageBase64) throw error(400, 'Bild fehlt');

	const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
	const imgType = validTypes.includes(mediaType) ? mediaType : 'image/jpeg';

	const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
	const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
	const result = await model.generateContent([
		PROMPT,
		{ inlineData: { data: imageBase64, mimeType: imgType } }
	]);
	const text = result.response.text();
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) throw error(422, 'Kein Rezept im Bild gefunden');

	try {
		return json(JSON.parse(jsonMatch[0]));
	} catch {
		throw error(422, 'Rezept konnte nicht geparst werden');
	}
};
