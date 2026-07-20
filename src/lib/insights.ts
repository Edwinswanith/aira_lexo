import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type InsightFrontmatter = {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  reviewer?: string;
  reviewedAt?: string;
  sources: Array<{ label: string; url: string }>;
  tags: string[];
  draft: boolean;
};

const contentDirectory = path.join(process.cwd(), "content", "insights");

export async function getAllInsights(includeDrafts = process.env.NODE_ENV !== "production") {
  const files = (await readdir(contentDirectory)).filter((file) => file.endsWith(".mdx"));
  const insights = await Promise.all(files.map(async (file) => {
    const raw = await readFile(path.join(contentDirectory, file), "utf8");
    const { data, content } = matter(raw);
    return { frontmatter: data as InsightFrontmatter, content };
  }));
  return insights
    .filter(({ frontmatter }) => includeDrafts || !frontmatter.draft)
    .sort((a, b) => b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt));
}

export async function getInsight(slug: string) {
  const insights = await getAllInsights();
  return insights.find(({ frontmatter }) => frontmatter.slug === slug);
}
