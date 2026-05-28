import mongoose from 'mongoose';
import { env } from '$env/dynamic/private';

let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectMongoose(): Promise<typeof mongoose> | Promise<void> {
	if (mongoose.connection.readyState === 1) return Promise.resolve();
	if (!connectionPromise) {
		connectionPromise = mongoose.connect(env.MONGO_URI as string);
		connectionPromise.catch(() => { connectionPromise = null; });
	}
	return connectionPromise;
}
