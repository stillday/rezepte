import { sequence } from '@sveltejs/kit/hooks';
import { authHandle } from './auth';
import { redirect, type Handle } from '@sveltejs/kit';

const authGuard: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const isProtected = path.startsWith('/recipes') || path.startsWith('/pantry');

	if (!isProtected) return resolve(event);

	const session = await event.locals.auth();
	if (!session) {
		if (path.startsWith('/api/')) return new Response('Unauthorized', { status: 401 });
		throw redirect(303, '/');
	}

	return resolve(event);
};

export const handle = sequence(authHandle, authGuard);
