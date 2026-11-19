import type { Db } from "mongodb";
import { describe, expect, it } from "vitest";
import type { PilotApplicationRequest } from "./pilot";
import {
  allowSubmission,
  deleteExpiredApplications,
  findApplicationsAwaitingRetry,
  fromStoredApplication,
  hasRecentApplication,
  insertApplication,
  setNotificationStatus,
  toStoredApplication,
} from "./pilot-store";

type Doc = Record<string, unknown>;
type Condition = { $gt?: Date; $gte?: Date; $lt?: Date };

function matches(doc: Doc, filter: Doc) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = doc[key];
    if (expected && typeof expected === "object" && !(expected instanceof Date) && ("$gt" in expected || "$gte" in expected || "$lt" in expected)) {
      const condition = expected as Condition;
      const time = (actual as Date).getTime();
      if (condition.$gt && !(time > condition.$gt.getTime())) return false;
      if (condition.$gte && !(time >= condition.$gte.getTime())) return false;
      if (condition.$lt && !(time < condition.$lt.getTime())) return false;
      return true;
    }
    return String(actual) === String(expected);
  });
}

/** Just enough of the MongoDB collection API to exercise pilot-store queries. */
function fakeDb() {
  const store = new Map<string, Doc[]>();
  let nextId = 1;
  const collection = (name: string) => {
    const docs = store.get(name) ?? [];
    store.set(name, docs);
    return {
      insertOne: async (doc: Doc) => {
        const _id = `id-${nextId++}`;
        docs.push({ ...doc, _id });
        return { insertedId: _id };
      },
      countDocuments: async (filter: Doc) => docs.filter((doc) => matches(doc, filter)).length,
      findOne: async (filter: Doc) => docs.find((doc) => matches(doc, filter)) ?? null,
      updateOne: async (filter: Doc, update: { $set: Doc }) => {
        const doc = docs.find((item) => matches(item, filter));
        if (doc) Object.assign(doc, update.$set);
      },
      find: (filter: Doc) => ({
        limit: (count: number) => ({ toArray: async () => docs.filter((doc) => matches(doc, filter)).slice(0, count) }),
      }),
      deleteMany: async (filter: Doc) => {
        const keep = docs.filter((doc) => !matches(doc, filter));
        docs.splice(0, docs.length, ...keep);
      },
    };
  };
  return { db: { collection } as unknown as Db, store };
}

const application: PilotApplicationRequest = {
  fullName: "Dr Maya Rao",
  email: "maya@example.com",
  phone: "",
  role: "doctor",
  specialty: "General medicine",
  organization: "",
  city: "chennai",
  otherCity: "",
  dailyPatientVolume: "20_40",
  documentationMethod: "mixed",
  repeatVisitShare: "25_50",
  pilotInterest: "",
  consentToContact: true,
  privacyPolicyVersion: "2026-11-19",
  source: "website",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  website: "",
};

describe("pilot application storage", () => {
  it("round-trips an application through the stored shape", () => {
    const stored = toStoredApplication(application, "received", new Date("2026-11-19T10:00:00Z"));
    expect(stored.phone).toBeNull();
    expect(stored.notification_status).toBe("pending");
    expect(fromStoredApplication(stored)).toEqual(application);
  });

  it("allows five submissions per network in 15 minutes and blocks the sixth", async () => {
    const { db } = fakeDb();
    const start = new Date("2026-11-19T10:00:00Z");
    const results = [];
    for (let index = 0; index < 6; index += 1) {
      results.push(await allowSubmission(db, "hash-a", new Date(start.getTime() + index * 1000)));
    }
    expect(results).toEqual([true, true, true, true, true, false]);
    expect(await allowSubmission(db, "hash-b", start)).toBe(true);
    expect(await allowSubmission(db, "hash-a", new Date(start.getTime() + 16 * 60 * 1000))).toBe(true);
  });

  it("treats the same email within 30 days as already received", async () => {
    const { db } = fakeDb();
    const created = new Date("2026-11-01T10:00:00Z");
    await insertApplication(db, toStoredApplication(application, "received", created));
    expect(await hasRecentApplication(db, application.email, new Date("2026-11-19T10:00:00Z"))).toBe(true);
    expect(await hasRecentApplication(db, application.email, new Date("2026-12-05T10:00:00Z"))).toBe(false);
    expect(await hasRecentApplication(db, "other@example.com", new Date("2026-11-19T10:00:00Z"))).toBe(false);
  });

  it("queues failed notifications for retry and clears them once sent", async () => {
    const { db } = fakeDb();
    const id = await insertApplication(db, toStoredApplication(application, "received"));
    await setNotificationStatus(db, id, "retry");
    expect(await findApplicationsAwaitingRetry(db)).toHaveLength(1);
    await setNotificationStatus(db, id, "sent");
    expect(await findApplicationsAwaitingRetry(db)).toHaveLength(0);
  });

  it("deletes applications older than 12 months", async () => {
    const { db, store } = fakeDb();
    await insertApplication(db, toStoredApplication(application, "received", new Date("2025-10-01T00:00:00Z")));
    await insertApplication(db, toStoredApplication(application, "received", new Date("2026-10-01T00:00:00Z")));
    await deleteExpiredApplications(db, new Date("2026-11-19T00:00:00Z"));
    expect(store.get("pilot_applications")).toHaveLength(1);
  });
});
