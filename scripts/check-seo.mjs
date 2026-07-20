import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = fileURLToPath(new URL("..", import.meta.url));
const insightsDirectory = join(root, "content", "insights");
const files = (await readdir(insightsDirectory)).filter((file) => file.endsWith(".mdx"));
const errors = [];
const slugs = new Set();
const titles = new Set();
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function addError(file, message) {
  errors.push(`${file}: ${message}`);
}

function isValidDate(value) {
  return typeof value === "string" && isoDate.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

for (const file of files) {
  const raw = await readFile(join(insightsDirectory, file), "utf8");
  const { data, content } = matter(raw);
  const expectedSlug = basename(file, ".mdx");

  for (const field of ["title", "description", "slug", "publishedAt", "author"]) {
    if (typeof data[field] !== "string" || !data[field].trim()) addError(file, `${field} must be a non-empty string`);
  }

  if (data.slug !== expectedSlug) addError(file, `slug must match the filename ${expectedSlug}`);
  if (slugs.has(data.slug)) addError(file, "slug must be unique");
  if (titles.has(data.title)) addError(file, "title must be unique");
  slugs.add(data.slug);
  titles.add(data.title);

  if (typeof data.title === "string" && data.title.length > 70) addError(file, "title must be 70 characters or fewer");
  if (typeof data.description === "string" && (data.description.length < 50 || data.description.length > 180)) addError(file, "description must be between 50 and 180 characters");
  if (!isValidDate(data.publishedAt)) addError(file, "publishedAt must be a valid YYYY-MM-DD date");
  if (data.updatedAt !== undefined && !isValidDate(data.updatedAt)) addError(file, "updatedAt must be a valid YYYY-MM-DD date");
  if (data.reviewedAt !== undefined && !isValidDate(data.reviewedAt)) addError(file, "reviewedAt must be a valid YYYY-MM-DD date");
  if (typeof data.draft !== "boolean") addError(file, "draft must be a boolean");
  if (!Array.isArray(data.tags) || data.tags.length === 0 || data.tags.some((tag) => typeof tag !== "string" || !tag.trim())) addError(file, "tags must contain at least one non-empty string");
  if (!Array.isArray(data.sources)) {
    addError(file, "sources must be an array");
  } else {
    for (const source of data.sources) {
      if (!source || typeof source.label !== "string" || !source.label.trim()) addError(file, "each source must have a label");
      try {
        const url = new URL(source?.url);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Unsupported protocol");
      } catch {
        addError(file, "each source must have a valid HTTP or HTTPS URL");
      }
    }
  }

  if (data.draft === false && (typeof content !== "string" || content.trim().length < 200)) addError(file, "a published article must contain at least 200 characters");

  const isCompanyUpdate = Array.isArray(data.tags) && data.tags.includes("Company update");
  if (data.draft === false && !isCompanyUpdate) {
    if (typeof data.reviewer !== "string" || !data.reviewer.trim()) addError(file, "a published health-related article requires a named reviewer");
    if (!isValidDate(data.reviewedAt)) addError(file, "a published health-related article requires a valid reviewedAt date");
    if (!Array.isArray(data.sources) || data.sources.length === 0) addError(file, "a published health-related article requires at least one source");
  }
}

if (errors.length) {
  console.error(`SEO content checks failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

console.log(`SEO content checks passed for ${files.length} Insights files.`);
