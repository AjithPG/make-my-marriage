import "server-only";
import mongoose, { mongo } from "mongoose";
import { dbEnv } from "./env";

/**
 * One Mongoose connection per function instance, cached on globalThis so warm
 * invocations (and dev hot reloads) reuse it instead of opening new sockets.
 */
type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __mongoose?: Cache;
};
const cache: Cache = (globalForMongoose.__mongoose ??= {
  conn: null,
  promise: null,
});

mongoose.set("strictQuery", true);

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose.connect(dbEnv().MONGODB_URI, {
    bufferCommands: false, // fail fast instead of queueing when disconnected
    maxPoolSize: 5, // keep Atlas connection counts low across instances
    serverSelectionTimeoutMS: 5_000,
    autoIndex: false, // indexes are created by migrations only
    autoCreate: false,
    writeConcern: { w: "majority" },
    readPreference: "primary",
  });

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}

/** True for MongoDB's duplicate-key error (a unique index rejected the write). */
export function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof mongo.MongoServerError && error.code === 11000;
}
