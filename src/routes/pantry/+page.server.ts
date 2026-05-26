import type { PageServerLoad } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { Pantry } from '$lib/server/models/Pantry';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	await connectMongoose();

	const pantry = await Pantry.findOne({ userId: session!.user!.id }).lean();
	return { items: pantry?.items ?? [] };
};
