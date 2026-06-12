import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '$lib/server/mongoClient';
import { env } from '$env/dynamic/private';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET } = env;

export const { handle: authHandle, signIn, signOut } = SvelteKitAuth({
	providers: [
		Google({
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET
		})
	],
	adapter: MongoDBAdapter(clientPromise),
	trustHost: true,
	secret: AUTH_SECRET,
	callbacks: {
		session({ session, user }) {
			session.user.id = user.id;
			return session;
		}
	}
});
