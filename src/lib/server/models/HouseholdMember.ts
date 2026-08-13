import mongoose from 'mongoose';

// Ein Nutzer ist immer genau einem Haushalt zugeordnet (unique userId).
const HouseholdMemberSchema = new mongoose.Schema(
	{
		userId: { type: String, required: true, unique: true },
		householdId: { type: String, required: true, index: true }
	},
	{ timestamps: true }
);

export const HouseholdMember =
	mongoose.models.HouseholdMember || mongoose.model('HouseholdMember', HouseholdMemberSchema);
