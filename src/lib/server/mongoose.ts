import mongoose from 'mongoose';
import { env } from '$env/dynamic/private';

const g = globalThis as typeof globalThis & { _mongooseConnected?: boolean };

export async function connectMongoose() {
	if (g._mongooseConnected || mongoose.connection.readyState === 1) return;
	await mongoose.connect(env.MONGO_URI as string);
	g._mongooseConnected = true;
}
