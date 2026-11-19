import type { Db } from "mongodb";

type Doc = Record<string, unknown>;

function isOperatorObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !(value instanceof Date) && Object.keys(value as object).some((key) => key.startsWith("$"));
}

function comparable(value: unknown) {
  return value instanceof Date ? value.getTime() : value;
}

function matches(doc: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = doc[key];
    if (!isOperatorObject(expected)) return String(comparable(actual)) === String(comparable(expected));
    return Object.entries(expected).every(([op, operand]) => {
      const a = comparable(actual) as number;
      const b = comparable(operand) as number;
      switch (op) {
        case "$gt": return a > b;
        case "$gte": return a >= b;
        case "$lt": return a < b;
        case "$in": return (operand as unknown[]).includes(actual);
        case "$exists": return (actual !== undefined) === operand;
        default: throw new Error(`fake-mongo does not support ${op}`);
      }
    });
  });
}

function applyUpdate(doc: Doc, update: Record<string, Doc>, inserting: boolean) {
  for (const [op, fields] of Object.entries(update)) {
    for (const [key, value] of Object.entries(fields)) {
      if (op === "$set") doc[key] = value;
      else if (op === "$setOnInsert") { if (inserting) doc[key] = value; }
      else if (op === "$unset") delete doc[key];
      else if (op === "$inc") doc[key] = ((doc[key] as number) || 0) + (value as number);
      else if (op === "$push") doc[key] = [...((doc[key] as unknown[]) || []), value];
      else throw new Error(`fake-mongo does not support ${op}`);
    }
  }
}

/** A tiny in-memory stand-in for the MongoDB calls used by the store, with unique indexes. */
export function fakeDb(uniqueFields: Record<string, string[]> = {}) {
  const store = new Map<string, Doc[]>();
  let nextId = 1;
  const duplicate = () => Object.assign(new Error("E11000 duplicate key"), { code: 11000 });

  const collection = (name: string) => {
    const docs = store.get(name) ?? [];
    store.set(name, docs);
    const unique = ["_id", ...(uniqueFields[name] || [])];
    const checkUnique = (candidate: Doc, self?: Doc) => {
      for (const field of unique) {
        const value = candidate[field];
        if (value === undefined) continue;
        if (docs.some((doc) => doc !== self && String(doc[field]) === String(value))) throw duplicate();
      }
    };
    return {
      insertOne: async (doc: Doc) => {
        const stored = { _id: doc._id ?? `id-${nextId++}`, ...doc };
        checkUnique(stored);
        docs.push(stored);
        return { insertedId: stored._id };
      },
      findOne: async (filter: Doc) => docs.find((doc) => matches(doc, filter)) ?? null,
      countDocuments: async (filter: Doc) => docs.filter((doc) => matches(doc, filter)).length,
      find: (filter: Doc) => ({ limit: (count: number) => ({ toArray: async () => docs.filter((doc) => matches(doc, filter)).slice(0, count) }) }),
      updateOne: async (filter: Doc, update: Record<string, Doc>, options?: { upsert?: boolean }) => {
        const doc = docs.find((item) => matches(item, filter));
        if (doc) {
          const next = structuredClone(doc);
          applyUpdate(next, update, false);
          checkUnique(next, doc);
          Object.assign(doc, next);
          return { matchedCount: 1 };
        }
        if (options?.upsert) {
          const created: Doc = { ...filter };
          applyUpdate(created, update, true);
          checkUnique(created);
          docs.push(created);
        }
        return { matchedCount: 0 };
      },
      findOneAndUpdate: async (filter: Doc, update: Record<string, Doc>, options?: { returnDocument?: "before" | "after" }) => {
        const doc = docs.find((item) => matches(item, filter));
        if (!doc) return null;
        const before = structuredClone(doc);
        const next = structuredClone(doc);
        applyUpdate(next, update, false);
        checkUnique(next, doc);
        for (const key of Object.keys(doc)) delete doc[key];
        Object.assign(doc, next);
        return options?.returnDocument === "after" ? doc : before;
      },
      deleteOne: async (filter: Doc) => {
        const index = docs.findIndex((doc) => matches(doc, filter));
        if (index >= 0) docs.splice(index, 1);
      },
    };
  };
  return { db: { collection } as unknown as Db, store };
}
