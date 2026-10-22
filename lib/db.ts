import mongoose from "mongoose";

// Why cache the connection?
// In development, Next.js hot-reloads modules on every save. A plain
// `mongoose.connect()` at module level would open a new connection pool each
// time, and Atlas's free M0 tier quickly hits its connection limit.
// Storing the promise on `globalThis` (which survives hot reloads) means every
// request and every reload reuses the same connection. On Vercel the same
// trick lets warm serverless functions skip reconnecting.

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached: MongooseCache = (globalForMongoose.mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  // Read inside the function so scripts that load env vars late still work.
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and add your Atlas connection string.",
    );
  }

  cached.promise ??= mongoose.connect(uri, {
    // Fail fast instead of queueing queries while disconnected.
    bufferCommands: false,
  });

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Let the next request retry instead of reusing a failed promise.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
