import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Recipe } from '$lib/server/models/Recipe';

export const load: PageServerLoad = async (event) => {
	// ?manual=1 → leeres Rezept anlegen und direkt zum Editor weiterleiten.
	if (event.url.searchParams.get('manual') !== '1') return {};

	const session = await event.locals.auth();
	await connectMongoose();
	const recipe = await Recipe.create({ title: 'Neues Rezept', userId: session!.user!.id });
	throw redirect(303, `/recipes/${recipe._id.toString()}/edit`);
};
