import type { MetadataRoute } from "next";
import { getAllInsights } from "@/lib/insights";
import { site } from "@/lib/site";

const routes = ["", "/product", "/for-doctors", "/for-clinics", "/trust", "/patient-information", "/pilot", "/about", "/insights", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = routes.map((route) => ({ url: `${site.url}${route}`, lastModified: new Date("2026-07-20"), changeFrequency: route === "/insights" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : route === "/pilot" ? 0.9 : 0.7 }));
  const insights = (await getAllInsights(false)).map(({ frontmatter }) => ({
    url: `${site.url}/insights/${frontmatter.slug}`,
    lastModified: new Date(frontmatter.updatedAt || frontmatter.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));
  return [...pages, ...insights];
}
