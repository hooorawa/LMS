import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  // readyState 1 = connected. A cached connection can go stale (e.g. a dropped
  // Atlas socket after a dev-server restart) without mongoose ever tearing it
  // down, so don't trust `cache.conn` blindly.
  if (cache.conn && cache.conn.connection.readyState === 1) {
    return cache.conn;
  }
  cache.conn = null;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 20_000,
      })
      .catch((error) => {
        // Let the next call retry instead of replaying this rejection forever.
        cache.promise = null;
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
