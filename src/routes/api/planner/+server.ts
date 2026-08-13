import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectMongoose } from '$lib/server/mongoose';
import { WeekPlan } from '$lib/server/models/WeekPlan';
import { resolveHouseholdId } from '$lib/server/household';

interface Slot {
	day: number;
	recipeId: string;
}

function sanitizeSlots(input: unknown): Slot[] {
	if (!Array.isArray(input)) return [];
	const out: Slot[] = [];
	for (const raw of input as { day?: unknown; recipeId?: unknown }[]) {
		const day = raw?.day;
		const recipeId = raw?.recipeId;
		if (typeof recipeId === 'string' && typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6) {
			out.push({ day, recipeId });
		}
	}
	return out.slice(0, 50);
}

export const PUT: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const body = await event.request.json();
	const slots = sanitizeSlots(body.slots);

	await connectMongoose();
	const householdId = await resolveHouseholdId(session.user.id, session.user.name);
	await WeekPlan.findOneAndUpdate({ householdId }, { $set: { slots } }, { upsert: true });

	return json({ ok: true });
};
