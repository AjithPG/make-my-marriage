import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import mongoose, { type ClientSession } from "mongoose";
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

  cache.promise ??= mongoose
    .connect(dbEnv().MONGODB_URI, {
      bufferCommands: false, // fail fast instead of queueing when disconnected
      maxPoolSize: 5, // keep Atlas connection counts low across instances
      serverSelectionTimeoutMS: 5_000,
      autoIndex: false, // indexes are created by migrations only
      autoCreate: false,
      writeConcern: { w: "majority" },
      readPreference: "primary",
    })
    .then((m) => {
      // Lets Vercel Fluid compute close idle sockets before an instance is suspended.
      attachDatabasePool(m.connection.getClient());
      return m;
    });

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}

/**
 * Runs `fn` inside a MongoDB transaction (Database Design §5), retrying on
 * transient errors. Pass `session` to every read and write inside `fn`.
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const { connection } = await connectDb();
  return connection.transaction(fn);
}
