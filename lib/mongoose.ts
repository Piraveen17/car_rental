// lib/mongoose.ts
import mongoose from "mongoose";

if (!process.env.MONGO_URI) {
  throw new Error("Please define MONGO_URI in your environment variables");
}

// Use a global cached connection for development hot-reloading
let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = {
  conn: null,
  promise: null,
};

export async function connectToMongo() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise && process.env.MONGO_URI) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((mongoose) => {
        return mongoose;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
