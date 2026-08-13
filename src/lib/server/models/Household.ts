import mongoose from 'mongoose';

const HouseholdSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		ownerUserId: { type: String, required: true },
		inviteCode: { type: String, required: true, unique: true }
	},
	{ timestamps: true }
);

export const Household = mongoose.models.Household || mongoose.model('Household', HouseholdSchema);
