import mongoose from 'mongoose';

const PantryItemSchema = new mongoose.Schema({
	name: { type: String, required: true },
	category: {
		type: String,
		enum: ['spice', 'oil', 'basic'],
		default: 'basic'
	}
}, { _id: false });

const PantrySchema = new mongoose.Schema({
	// Ein gemeinsamer Vorrat pro Haushalt (nicht mehr pro Nutzer).
	householdId: { type: String, required: true, unique: true },
	items: { type: [PantryItemSchema], default: [] }
}, { timestamps: true });

export const Pantry = mongoose.models.Pantry || mongoose.model('Pantry', PantrySchema);
