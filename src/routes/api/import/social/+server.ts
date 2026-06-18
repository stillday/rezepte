import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { env } from '$env/dynamic/private';
import { getGeminiModel, SOCIAL_PROMPT, parseRecipeJson } from '$lib/server/gemini';

// Nur diese Hosts dürfen an yt-dlp übergeben werden (kein beliebiger Extractor → kein SSRF/Abuse).
const ALLOWED_HOSTS = new Set([
	'instagram.com', 'www.instagram.com',
	'tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'm.tiktok.com', 'vt.tiktok.com'
]);

interface YtDlpInfo {
	description?: string;
	title?: string;
	uploader?: string;
	thumbnail?: string;
	webpage_url?: string;
}

// Realistischer Browser-UA — der Default-yt-dlp-UA wird von Instagram öfter abgewiesen.
const BROWSER_UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class YtDlpError extends Error {
	constructor(readonly stderr: string) {
		super('yt-dlp fehlgeschlagen');
	}
}

// Optionale Login-Cookies (z.B. für Instagram). Greift nur, wenn YTDLP_COOKIES_FILE gesetzt ist
// und die Datei existiert — sonst no-op (öffentlicher Abruf).
function cookieArgs(): string[] {
	const file = env.YTDLP_COOKIES_FILE;
	return file && existsSync(file) ? ['--cookies', file] : [];
}

function runYtDlpOnce(url: string): Promise<YtDlpInfo> {
	return new Promise((resolve, reject) => {
		execFile(
			'yt-dlp',
			[
				'--dump-single-json',
				'--skip-download',
				'--no-warnings',
				'--no-playlist',
				'--socket-timeout', '12',
				'--retries', '2',
				'--extractor-retries', '2',
				'--user-agent', BROWSER_UA,
				...cookieArgs(),
				'--', // verhindert, dass die URL als Option interpretiert wird
				url
			],
			{ timeout: 18_000, maxBuffer: 16 * 1024 * 1024 },
			(err, stdout, stderr) => {
				if (err) return reject(new YtDlpError(stderr || String(err)));
				try {
					resolve(JSON.parse(stdout));
				} catch {
					reject(new YtDlpError(stderr || 'kein JSON'));
				}
			}
		);
	});
}

// Instagram drosselt Server-IPs sporadisch → bei Fehler ODER leerer Caption einmal erneut versuchen.
// Erkennt IGs „login required / rate-limit" und meldet das gezielt.
async function fetchPostInfo(url: string): Promise<YtDlpInfo> {
	let info: YtDlpInfo | null = null;
	let stderr = '';
	try {
		info = await runYtDlpOnce(url);
	} catch (e) {
		stderr = e instanceof YtDlpError ? e.stderr : '';
		info = null;
	}
	if (!info || (info.description || '').trim().length < 30) {
		await sleep(1500);
		try {
			info = await runYtDlpOnce(url);
		} catch (e) {
			stderr = e instanceof YtDlpError ? e.stderr : stderr;
			if (/login required|rate-?limit|cookies|not available/i.test(stderr)) {
				throw error(
					502,
					'Instagram verlangt für diesen Abruf eine Anmeldung (die Server-IP ist gedrosselt). TikTok-Links funktionieren ohne Anmeldung; für Instagram müssten Login-Cookies hinterlegt werden.'
				);
			}
			throw error(502, 'Abruf gerade nicht möglich — bitte in ein paar Sekunden erneut versuchen.');
		}
	}
	return info;
}

// Instagram über angemeldete instagrapi-Session (Python-Helfer) — nur wenn Credentials gesetzt sind.
function fetchViaInstagrapi(url: string): Promise<YtDlpInfo> {
	return new Promise((resolve, reject) => {
		const py = env.IG_PYTHON || '/opt/ytdlp/bin/python';
		const script = env.IG_FETCH_SCRIPT || 'scripts/ig_fetch.py';
		// Credentials explizit an den Subprozess geben (SvelteKit-$env landet nicht garantiert in process.env).
		const childEnv = {
			...process.env,
			IG_USERNAME: env.IG_USERNAME ?? '',
			IG_PASSWORD: env.IG_PASSWORD ?? '',
			IG_TOTP_SECRET: env.IG_TOTP_SECRET ?? '',
			IG_SESSION_DIR: env.IG_SESSION_DIR ?? '/app/cookies'
		};
		execFile(py, [script, url], { timeout: 35_000, maxBuffer: 8 * 1024 * 1024, env: childEnv }, (err, stdout) => {
			if (!stdout) return reject(new YtDlpError(err ? String(err) : 'instagrapi: keine Ausgabe'));
			try {
				const data = JSON.parse(stdout);
				if (data.error) return reject(new YtDlpError(data.error));
				resolve(data as YtDlpInfo);
			} catch {
				reject(new YtDlpError('instagrapi: kein gültiges JSON'));
			}
		});
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

	// Instagram mit hinterlegten Login-Credentials → angemeldete Session (instagrapi).
	// Sonst (TikTok, oder IG ohne Credentials) → yt-dlp (nutzt optional die Cookie-Datei).
	const isInstagram = u.hostname === 'instagram.com' || u.hostname.endsWith('.instagram.com');
	const useInstagrapi = isInstagram && !!env.IG_USERNAME && !!env.IG_PASSWORD;

	let info: YtDlpInfo;
	try {
		info = useInstagrapi ? await fetchViaInstagrapi(u.toString()) : await fetchPostInfo(u.toString());
	} catch (e) {
		if (isHttpError(e)) throw e; // gezielte Meldung aus fetchPostInfo durchreichen
		const detail = e instanceof YtDlpError ? e.stderr : '';
		if (useInstagrapi) {
			throw error(502, `Instagram-Abruf über den hinterlegten Account fehlgeschlagen${detail ? ` (${detail})` : ''}. Session evtl. abgelaufen — bitte später erneut versuchen oder Session neu bootstrappen.`);
		}
		throw error(502, 'Instagram/TikTok hat den Abruf gerade abgelehnt — bitte in ein paar Sekunden noch einmal versuchen.');
	}

	const caption = (info.description || '').trim();
	if (caption.length < 30) {
		throw error(422, 'Keine lesbare Rezept-Beschreibung gefunden. Entweder steht das Rezept nur im Video, oder Instagram hat den Abruf gerade gedrosselt — bitte erneut versuchen.');
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
