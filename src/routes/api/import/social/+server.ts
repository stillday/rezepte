import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { execFile } from 'node:child_process';
import { getGeminiModel, SOCIAL_PROMPT, parseRecipeJson } from '$lib/server/gemini';

// Nur diese Hosts dürfen an yt-dlp übergeben werden (kein beliebiger Extractor → kein SSRF/Abuse).
const ALLOWED_HOSTS = new Set([
	'instagram.com', 'www.instagram.com',
	'tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'm.tiktok.com'
]);

interface YtDlpInfo {
	description?: string;
	title?: string;
	uploader?: string;
	thumbnail?: string;
	webpage_url?: string;
}

function runYtDlp(url: string): Promise<YtDlpInfo> {
	return new Promise((resolve, reject) => {
		execFile(
			'yt-dlp',
			[
				'--dump-single-json',
				'--skip-download',
				'--no-warnings',
				'--no-playlist',
				'--socket-timeout', '15',
				'--', // verhindert, dass die URL als Option interpretiert wird
				url
			],
			{ timeout: 25_000, maxBuffer: 16 * 1024 * 1024 },
			(err, stdout) => {
				if (err) return reject(err);
				try {
					resolve(JSON.parse(stdout));
				} catch {
					reject(new Error('yt-dlp lieferte kein gültiges JSON'));
				}
			}
		);
	});
}

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { url } = await event.request.json();
	if (!url || typeof url !== 'string') throw error(400, 'URL fehlt');

	let u: URL;
	try {
		u = new URL(url);
	} catch {
		throw error(400, 'Ungültige URL');
	}
	if (!['http:', 'https:'].includes(u.protocol) || !ALLOWED_HOSTS.has(u.hostname)) {
		throw error(400, 'Nur Instagram- oder TikTok-Links erlaubt');
	}

	let info: YtDlpInfo;
	try {
		info = await runYtDlp(u.toString());
	} catch {
		throw error(502, 'Beitrag konnte nicht geladen werden (privat, gelöscht oder blockiert?)');
	}

	const caption = (info.description || '').trim();
	if (caption.length < 30) {
		throw error(422, 'Keine Rezeptbeschreibung im Beitrag gefunden — steht das Rezept nur im Video, geht es (noch) nicht.');
	}

	try {
		const model = getGeminiModel();
		const safeCaption = caption.replace(/<\/?\s*CONTENT\s*>/gi, '').slice(0, 8000);
		const result = await model.generateContent(`${SOCIAL_PROMPT}\n\n<CONTENT>\n${safeCaption}\n</CONTENT>`);
		const recipe = parseRecipeJson(result.response.text());

		if (!recipe.title) throw error(422, 'Im Beitrag wurde kein Rezept erkannt');

		recipe.sourceUrl = info.webpage_url || u.toString();
		if (info.thumbnail) recipe.imageUrl = info.thumbnail;
		return json(recipe);
	} catch (e) {
		if (isHttpError(e)) throw e;
		throw error(502, 'KI-Analyse fehlgeschlagen — bitte erneut versuchen');
	}
};
