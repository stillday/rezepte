import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import dns from 'node:dns/promises';
import net from 'node:net';
import { getGeminiModel, URL_PROMPT, parseRecipeJson } from '$lib/server/gemini';

function isPrivateIp(ip: string): boolean {
	if (!net.isIP(ip)) return true;
	return (
		/^(127\.|10\.|169\.254\.|0\.)/.test(ip) ||
		/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
		/^192\.168\./.test(ip) ||
		/^(::1$|fc|fd|fe80)/i.test(ip)
	);
}

async function validatePublicUrl(rawUrl: string): Promise<string> {
	let u: URL;
	try { u = new URL(rawUrl); } catch { throw error(400, 'Ungültige URL'); }
	if (!['http:', 'https:'].includes(u.protocol)) throw error(400, 'Nur HTTP(S) erlaubt');
	if (u.port && !['', '80', '443'].includes(u.port)) throw error(400, 'Port nicht erlaubt');

	try {
		const { address } = await dns.lookup(u.hostname);
		if (isPrivateIp(address)) throw error(400, 'Diese URL ist nicht erlaubt');
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(400, 'Domain konnte nicht aufgelöst werden');
	}
	return rawUrl;
}

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { url } = await event.request.json();
	if (!url) throw error(400, 'URL fehlt');

	const safeUrl = await validatePublicUrl(url);

	let pageText: string;
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10_000);
		const res = await fetch(safeUrl, {
			headers: { 'User-Agent': 'Mozilla/5.0' },
			signal: controller.signal,
			redirect: 'follow'
		});
		clearTimeout(timeout);

		const html = await res.text();
		pageText = html
			.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 12000);
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(400, 'Seite konnte nicht geladen werden');
	}

	try {
		const model = getGeminiModel();
		const safeContent = pageText.replace(/<\/?\s*CONTENT\s*>/gi, '');
		const result = await model.generateContent(`${URL_PROMPT}\n\n<CONTENT>\n${safeContent}\n</CONTENT>`);
		const recipe = parseRecipeJson(result.response.text());
		recipe.sourceUrl = safeUrl;
		return json(recipe);
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(502, 'KI-Analyse fehlgeschlagen — bitte erneut versuchen');
	}
};
