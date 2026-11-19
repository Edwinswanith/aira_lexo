import { MongoClient, type Db } from "mongodb";

type MongoCache = {
  client: MongoClient | null;
  db: Promise<Db> | null;
};

// Serverless functions reuse warm instances, so keep one client per instance
// instead of opening a new connection on every request.
const globalForMongo = globalThis as typeof globalThis & { __airaMongo?: MongoCache };
const cache: MongoCache = globalForMongo.__airaMongo ?? { client: null, db: null };
globalForMongo.__airaMongo = cache;

export function isDatabaseConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

async function ensureIndexes(db: Db) {
  const applications = db.collection("pilot_applications");
  const rateLimits = db.collection("pilot_rate_limits");
  await Promise.all([
    applications.createIndex({ email: 1, created_at: -1 }, { name: "email_created" }),
    applications.createIndex({ notification_status: 1 }, { name: "notification_status" }),
    // Applications are kept for 12 months, then removed automatically.
    applications.createIndex({ created_at: 1 }, { name: "retention_12_months", expireAfterSeconds: 365 * 24 * 60 * 60 }),
    rateLimits.createIndex({ network_hash: 1, created_at: -1 }, { name: "network_created" }),
    rateLimits.createIndex({ created_at: 1 }, { name: "expire_24_hours", expireAfterSeconds: 24 * 60 * 60 }),
  ]);
}

/**
 * Returns the application database, or null when MONGODB_URI is not set.
 * Indexes are created once per warm instance; createIndex is idempotent.
 */
export async function getDatabase(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (!cache.db) {
    const client = new MongoClient(uri, {
      appName: "aira-website",
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    cache.client = client;
    cache.db = client
      .connect()
      .then(async (connected) => {
        const db = connected.db(process.env.MONGODB_DB || "aira");
        await ensureIndexes(db);
        return db;
      })
      .catch((error) => {
        // Let the next request retry instead of caching a failed connection.
        cache.client = null;
        cache.db = null;
        throw error;
      });
  }

  return cache.db;
}
