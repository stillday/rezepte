import { sequence } from '@sveltejs/kit/hooks';
import { authHandle } from './auth';
import { redirect, error, type Handle } from '@sveltejs/kit';

const rateLimits = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
	const now = Date.now();
	const bucket = rateLimits.get(key);
	if (!bucket || bucket.reset < now) {
		rateLimits.set(key, { count: 1, reset: now + windowMs });
		return true;
	}
	if (bucket.count >= limit) return false;
	bucket.count++;
	return true;
}

const authGuard: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const isProtected =
		path.startsWith('/recipes') ||
		path.startsWith('/pantry') ||
		path.startsWith('/household') ||
		path.startsWith('/planner') ||
		(path.startsWith('/api/') && !path.startsWith('/api/auth'));

	if (!isProtected) return resolve(event);

	const session = await event.locals.auth();
	if (!session) {
		if (path.startsWith('/api/')) return new Response('Unauthorized', { status: 401 });
		throw redirect(303, '/');
	}

	if (path.startsWith('/api/import/') && session.user?.id) {
		if (!checkRateLimit(`import:${session.user.id}`, 10, 60_000)) {
			throw error(429, 'Zu viele Anfragen — bitte warte eine Minute');
		}
	}

	// Begrenzt Versuche, Einladungscodes zu erraten (Code selbst ist mit 192 Bit Entropie
	// bereits robust, aber Defense-in-Depth gegen einen eingeloggten Angreifer).
	if (path === '/api/household/join' && session.user?.id) {
		if (!checkRateLimit(`household-join:${session.user.id}`, 10, 5 * 60_000)) {
			throw error(429, 'Zu viele Versuche — bitte in ein paar Minuten erneut versuchen');
		}
	}

	return resolve(event);
};

const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
	response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
	return response;
};

export const handle = sequence(authHandle, authGuard, securityHeaders);
