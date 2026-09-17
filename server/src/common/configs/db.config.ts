import mongoose from "mongoose";
import { ENVIRONMENT } from "./environment.config";

const uri = ENVIRONMENT.DB.URI || "mongodb://localhost:27017/faculty-library";
//This is to prevent multiple connections in prduction
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}
export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    // Note: Do NOT 'await' here, assign the promise itself
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`Connected to MongoDB`);
  } catch (e) {
    cached.promise = null; // Reset if it fails
    throw e;
  }
  return cached.conn;
};

/**
 * Synchronous, allocation-free read of the driver state.
 * Lets request middleware skip work entirely when the
 * startup-time connection is already up.
 */
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};
