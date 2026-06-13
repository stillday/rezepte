import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import dnsp from 'node:dns/promises';
import dns from 'node:dns';
import net from 'node:net';
import { request, Agent } from 'undici';
import { getGeminiModel, URL_PROMPT, parseRecipeJson } from '$lib/server/gemini';

function isPrivateIp(ip: string): boolean {
	// IPv4-mapped IPv6 (::ffff:127.0.0.1) auf die v4-Adresse reduzieren
	const v4 = ip.replace(/^::ffff:/i, '');
	if (!net.isIP(v4)) return true;
	return (
		/^(127\.|10\.|169\.254\.|0\.)/.test(v4) ||
		/^172\.(1[6-9]|2\d|3[0-1])\./.test(v4) ||
		/^192\.168\./.test(v4) ||
		/^(::1$|fc|fd|fe80|::$)/i.test(v4)
	);
}

// Schneller Pre-Check: Protokoll/Port + offensichtlich interne Ziele mit klarer Fehlermeldung ablehnen.
async function validatePublicUrl(rawUrl: string): Promise<string> {
	let u: URL;
	try { u = new URL(rawUrl); } catch { throw error(400, 'Ungültige URL'); }
	if (!['http:', 'https:'].includes(u.protocol)) throw error(400, 'Nur HTTP(S) erlaubt');
	if (u.port && !['', '80', '443'].includes(u.port)) throw error(400, 'Port nicht erlaubt');

	try {
		const records = await dnsp.lookup(u.hostname, { all: true });
		if (records.length === 0 || records.some((r) => isPrivateIp(r.address))) {
			throw error(400, 'Diese URL ist nicht erlaubt');
		}
	} catch (e) {
		if (isHttpError(e)) throw e;
		throw error(400, 'Domain konnte nicht aufgelöst werden');
	}
	return rawUrl;
}

// Dispatcher mit eigenem DNS-Lookup: prüft die aufgelöste IP an der tatsächlichen Connection.
// Schließt das DNS-Rebinding-Fenster zwischen validatePublicUrl und dem echten Connect.
// (undici erzwingt all:true und erwartet das Adress-Array im Callback.)
const ssrfAgent = new Agent({
	connect: {
		lookup(hostname, _options, callback) {
			dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
				if (err) return callback(err, []);
				const list = addresses as dns.LookupAddress[];
				if (list.length === 0 || list.some((a) => isPrivateIp(a.address))) {
					return callback(new Error('SSRF: nicht-öffentliche Adresse blockiert'), []);
				}
				callback(null, list);
			});
		}
	}
});

// Folgt Redirects manuell (undici.request liefert Status + Location, anders als fetch's
// opaqueredirect) und validiert jeden Hop neu — blockt auch Redirects auf literale interne IPs.
async function fetchSafe(startUrl: string, signal: AbortSignal): Promise<string> {
	let currentUrl = startUrl;
	for (let hop = 0; hop < 5; hop++) {
		// undici.request folgt standardmäßig KEINEN Redirects → wir lesen Location selbst.
		const res = await request(currentUrl, {
			method: 'GET',
			headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html' },
			dispatcher: ssrfAgent,
			signal
		});
		if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
			await res.body.dump();
			const loc = Array.isArray(res.headers.location) ? res.headers.location[0] : res.headers.location;
			currentUrl = await validatePublicUrl(new URL(loc, currentUrl).toString());
			continue;
		}
		return res.body.text();
	}
	throw error(400, 'Zu viele Weiterleitungen');
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
		let html: string;
		try {
			html = await fetchSafe(safeUrl, controller.signal);
		} finally {
			clearTimeout(timeout);
		}
		pageText = html
			.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 12000);
	} catch (e) {
		if (isHttpError(e)) throw e; // z.B. SSRF-Block aus validatePublicUrl bei Redirect
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
		if (isHttpError(e)) throw e;
		throw error(502, 'KI-Analyse fehlgeschlagen — bitte erneut versuchen');
	}
};
