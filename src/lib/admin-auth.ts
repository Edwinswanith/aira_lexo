import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Db } from "mongodb";
import { getDatabase } from "./mongodb";

export const ADMIN_COOKIE = "aira_admin_session";
const LOGIN_LINK_MINUTES = 15;
const SESSION_DAYS = 7;

type LoginToken = { _id: string; email: string; expires_at: Date };
type AdminSession = { _id: string; email: string; created_at: Date; expires_at: Date };

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email: string) {
  return adminEmails().includes(email.trim().toLowerCase());
}

/** Creates a single-use sign-in token. Only its hash is stored. */
export async function createLoginToken(db: Db, email: string, now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  await db.collection<LoginToken>("admin_login_tokens").insertOne({
    _id: sha256(token),
    email: email.trim().toLowerCase(),
    expires_at: new Date(now.getTime() + LOGIN_LINK_MINUTES * 60 * 1000),
  });
  return token;
}

/** Uses up a sign-in token and starts a session. Returns the session id, or null. */
export async function redeemLoginToken(db: Db, token: string, now = new Date()) {
  const record = await db.collection<LoginToken>("admin_login_tokens").findOneAndDelete({ _id: sha256(token) });
  if (!record || record.expires_at < now || !isAdminEmail(record.email)) return null;
  const sessionId = randomBytes(32).toString("base64url");
  await db.collection<AdminSession>("admin_sessions").insertOne({
    _id: sha256(sessionId),
    email: record.email,
    created_at: now,
    expires_at: new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000),
  });
  return { sessionId, maxAge: SESSION_DAYS * 24 * 60 * 60 };
}

export async function findAdminSession(db: Db, sessionId: string, now = new Date()) {
  const session = await db.collection<AdminSession>("admin_sessions").findOne({ _id: sha256(sessionId) });
  if (!session || session.expires_at < now || !isAdminEmail(session.email)) return null;
  return { email: session.email };
}

export async function endAdminSession(db: Db, sessionId: string) {
  await db.collection<AdminSession>("admin_sessions").deleteOne({ _id: sha256(sessionId) });
}

/** For admin pages and actions: returns the signed-in admin and database, or sends them to sign in. */
export async function requireAdmin() {
  const db = await getDatabase().catch(() => null);
  if (!db) redirect("/admin/login?error=unavailable");
  const sessionId = (await cookies()).get(ADMIN_COOKIE)?.value;
  const admin = sessionId ? await findAdminSession(db, sessionId) : null;
  if (!admin) redirect("/admin/login");
  return { db, admin };
}
