import { randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { Household } from './models/Household';
import { HouseholdMember } from './models/HouseholdMember';
import { Recipe } from './models/Recipe';
import { Pantry } from './models/Pantry';
import clientPromise from './mongoClient';

function generateInviteCode(): string {
	// 24 Bytes (192 Bit) statt eines kurzen Codes — der Join-Endpoint erfordert zwar bereits
	// Login, soll aber auch gegen einen eingeloggten Angreifer, der Codes durchprobiert, robust sein.
	return randomBytes(24).toString('base64url');
}

// Legt für einen neuen Nutzer einen eigenen (Solo-)Haushalt an und übernimmt dabei
// vorhandene Rezepte/Vorrat aus der Zeit vor dem Household-Feature — ersetzt ein
// separates Migrationsskript, läuft einmalig beim ersten Zugriff nach dem Deploy.
async function createHouseholdForUser(userId: string, userName?: string | null): Promise<string> {
	const household = await Household.create({
		name: userName ? `${userName}s Haushalt` : 'Mein Haushalt',
		ownerUserId: userId,
		inviteCode: generateInviteCode()
	});
	const householdId = household._id.toString();

	await HouseholdMember.create({ userId, householdId });
	await Promise.all([
		Recipe.updateMany({ userId, householdId: { $exists: false } }, { $set: { householdId } }),
		Pantry.updateMany({ userId, householdId: { $exists: false } }, { $set: { householdId } })
	]);

	return householdId;
}

export async function resolveHouseholdId(userId: string, userName?: string | null): Promise<string> {
	const membership = await HouseholdMember.findOne({ userId }).lean();
	if (membership) return membership.householdId;
	return createHouseholdForUser(userId, userName);
}

export async function getHouseholdInfo(householdId: string) {
	return Household.findById(householdId).lean();
}

export async function regenerateInviteCode(householdId: string): Promise<string> {
	const inviteCode = generateInviteCode();
	await Household.updateOne({ _id: householdId }, { $set: { inviteCode } });
	return inviteCode;
}

export async function listHouseholdMembers(householdId: string) {
	const memberships = await HouseholdMember.find({ householdId }).lean();
	if (memberships.length === 0) return [];

	const client = await clientPromise;
	const users = await client
		.db()
		.collection('users')
		.find({ _id: { $in: memberships.map((m) => new ObjectId(m.userId)) } })
		.toArray();
	const byId = new Map(users.map((u) => [u._id.toString(), u]));

	return memberships.map((m) => ({
		userId: m.userId,
		name: byId.get(m.userId)?.name ?? 'Unbekannt',
		email: byId.get(m.userId)?.email ?? '',
		image: byId.get(m.userId)?.image ?? null
	}));
}

export async function joinHouseholdByCode(userId: string, code: string): Promise<{ householdId: string; name: string }> {
	const target = await Household.findOne({ inviteCode: code }).lean();
	if (!target) throw new Error('not_found');

	const targetId = target._id.toString();
	const previous = await HouseholdMember.findOne({ userId }).lean();

	await HouseholdMember.findOneAndUpdate({ userId }, { $set: { householdId: targetId } }, { upsert: true });

	if (previous && previous.householdId !== targetId) {
		const stillOccupied = await HouseholdMember.exists({ householdId: previous.householdId });
		if (!stillOccupied) {
			// Vorheriger Haushalt war nur der eigene Solo-Haushalt (keine anderen Mitglieder mehr
			// darin) → eigene Rezepte + Vorrat in den neuen Haushalt mitnehmen statt sie verwaist
			// zurückzulassen.
			await Recipe.updateMany({ householdId: previous.householdId }, { $set: { householdId: targetId } });

			const oldPantry = await Pantry.findOne({ householdId: previous.householdId }).lean();
			if (oldPantry?.items?.length) {
				await Pantry.updateOne(
					{ householdId: targetId },
					{ $addToSet: { items: { $each: oldPantry.items } } },
					{ upsert: true }
				);
			}
			await Pantry.deleteOne({ householdId: previous.householdId });
			await Household.deleteOne({ _id: previous.householdId });
		}
	}

	return { householdId: targetId, name: target.name };
}
