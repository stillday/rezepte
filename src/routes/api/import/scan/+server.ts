import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGeminiModel, SCAN_PROMPT, parseRecipeJson } from '$lib/server/gemini';

const MAX_BASE64_BYTES = 8 * 1024 * 1024; // 8 MB

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { imageBase64, mediaType } = await event.request.json();
	if (!imageBase64) throw error(400, 'Bild fehlt');
	if (typeof imageBase64 !== 'string' || imageBase64.length > MAX_BASE64_BYTES) {
		throw error(400, 'Bild zu groß (max 6 MB)');
	}

	const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
	const imgType = validTypes.includes(mediaType) ? mediaType : 'image/jpeg';

	try {
		const model = getGeminiModel();
		const result = await model.generateContent([
			SCAN_PROMPT,
			{ inlineData: { data: imageBase64, mimeType: imgType } }
		]);
		return json(parseRecipeJson(result.response.text()));
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(502, 'KI-Analyse fehlgeschlagen — bitte erneut versuchen');
	}
};
