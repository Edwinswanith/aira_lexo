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
  const orders = db.collection("orders");
  await Promise.all([
    orders.createIndex({ order_number: 1 }, { name: "order_number", unique: true }),
    orders.createIndex({ razorpay_order_id: 1 }, { name: "razorpay_order_id", unique: true, partialFilterExpression: { razorpay_order_id: { $type: "string" } } }),
    orders.createIndex({ razorpay_payment_id: 1 }, { name: "razorpay_payment_id", unique: true, partialFilterExpression: { razorpay_payment_id: { $type: "string" } } }),
    orders.createIndex({ status: 1, reserved_until: 1 }, { name: "status_reserved_until" }),
    orders.createIndex({ created_at: -1 }, { name: "created_desc" }),
    db.collection("order_rate_limits").createIndex({ key: 1, created_at: -1 }, { name: "key_created" }),
    db.collection("order_rate_limits").createIndex({ created_at: 1 }, { name: "expire_24_hours", expireAfterSeconds: 24 * 60 * 60 }),
    db.collection("payment_events").createIndex({ received_at: 1 }, { name: "expire_180_days", expireAfterSeconds: 180 * 24 * 60 * 60 }),
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
