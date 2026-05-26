import mongoose from 'mongoose';

const IngredientSchema = new mongoose.Schema({
	name: { type: String, required: true },
	amount: { type: String },
	unit: { type: String }
}, { _id: false });

const NutritionSchema = new mongoose.Schema({
	calories: { type: Number },
	fat: { type: Number },
	sugar: { type: Number },
	protein: { type: Number }
}, { _id: false });

const RecipeSchema = new mongoose.Schema({
	userId: { type: String, required: true, index: true },
	title: { type: String, required: true },
	description: { type: String, default: '' },
	servings: { type: Number, default: 4 },
	prepTime: { type: Number },
	ingredients: { type: [IngredientSchema], default: [] },
	steps: { type: [String], default: [] },
	tags: { type: [String], default: [] },
	nutrition: { type: NutritionSchema, default: {} },
	sourceUrl: { type: String },
	imageUrl: { type: String }
}, { timestamps: true });

export const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);
