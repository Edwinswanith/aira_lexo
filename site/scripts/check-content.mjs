import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const userFacingExtensions = new Set([".ts", ".tsx", ".md", ".mdx", ".json", ".css"]);
const ignored = new Set(["node_modules", ".next", ".git"]);
const violations = [];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (userFacingExtensions.has(extname(entry.name))) {
      const content = await readFile(path, "utf8");
      if (content.includes("\u2014")) violations.push(path.replace(root, ""));
    }
  }
}

await scan(root);

if (violations.length) {
  console.error(`Em dash characters found in: ${violations.join(", ")}`);
  process.exit(1);
}

console.log("Content check passed. No em dash characters found.");
