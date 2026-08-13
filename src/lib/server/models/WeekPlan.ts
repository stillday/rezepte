import mongoose from 'mongoose';

// Kein konkretes Datum, sondern ein wiederkehrender Wochenplan (Mo-So) pro Haushalt —
// passt besser zu "montags gibt's meistens X" als ein datumsgebundener Kalender.
const SlotSchema = new mongoose.Schema(
	{
		day: { type: Number, required: true, min: 0, max: 6 },
		recipeId: { type: String, required: true }
	},
	{ _id: false }
);

const WeekPlanSchema = new mongoose.Schema(
	{
		householdId: { type: String, required: true, unique: true },
		slots: { type: [SlotSchema], default: [] }
	},
	{ timestamps: true }
);

export const WeekPlan = mongoose.models.WeekPlan || mongoose.model('WeekPlan', WeekPlanSchema);
