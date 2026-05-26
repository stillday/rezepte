import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Anthropic from '@anthropic-ai/sdk';
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

	const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
	const msg = await client.messages.create({
		model: 'claude-sonnet-4-6',
		max_tokens: 2048,
		messages: [{
			role: 'user',
			content: [
				{
					type: 'image',
					source: { type: 'base64', media_type: imgType as 'image/jpeg', data: imageBase64 }
				},
				{ type: 'text', text: PROMPT }
			]
		}]
	});

	const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) throw error(422, 'Kein Rezept im Bild gefunden');

	try {
		return json(JSON.parse(jsonMatch[0]));
	} catch {
		throw error(422, 'Rezept konnte nicht geparst werden');
	}
};
