import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { connectMongoose } from '$lib/server/mongoose';
import { Household } from '$lib/server/models/Household';

export const load: PageServerLoad = async (event) => {
	await connectMongoose();
	const household = await Household.findOne({ inviteCode: event.params.code }).lean();
	if (!household) throw error(404, 'Einladungscode ungültig oder abgelaufen');

	return { code: event.params.code, householdName: household.name };
};
