import { readFile } from "node:fs/promises";

// Public contact details and policy terms live in src/lib/business.ts.
// A string value written as "[SOMETHING]" is a placeholder that must be
// replaced before the contact, refund and shipping pages can be published.
const source = await readFile(new URL("../src/lib/business.ts", import.meta.url), "utf8");
const placeholders = [...source.matchAll(/["'`](\[[A-Z0-9_ ]+\])["'`]/g)].map((match) => match[1]);

if (placeholders.length) {
  console.error(`Business details check failed. Replace these placeholders in src/lib/business.ts: ${placeholders.join(", ")}`);
  process.exit(1);
}
console.log("Business details check passed. No placeholders found.");
