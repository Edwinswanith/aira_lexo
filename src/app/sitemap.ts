import type { MetadataRoute } from "next";
import { getAllInsights } from "@/lib/insights";
import { absoluteUrl } from "@/lib/site";

const routes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/product", changeFrequency: "monthly", priority: 0.8 },
  { path: "/for-doctors", changeFrequency: "monthly", priority: 0.8 },
  { path: "/for-clinics", changeFrequency: "monthly", priority: 0.8 },
  { path: "/trust", changeFrequency: "monthly", priority: 0.7 },
  { path: "/patient-information", changeFrequency: "monthly", priority: 0.6 },
  { path: "/pilot", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/founders", changeFrequency: "monthly", priority: 0.7 },
  { path: "/insights", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.3 },
  { path: "/data-deletion", changeFrequency: "yearly", priority: 0.3 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const legalRoutes = new Set<string>(["/privacy-policy", "/terms-of-service", "/data-deletion"]);
  const pages = routes.map((route) => ({ url: absoluteUrl(route.path), lastModified: new Date(legalRoutes.has(route.path) ? "2026-11-06" : "2026-08-03"), changeFrequency: route.changeFrequency, priority: route.priority }));
  const insights = (await getAllInsights(false)).map(({ frontmatter }) => ({
    url: absoluteUrl(`/insights/${frontmatter.slug}`),
    lastModified: new Date(frontmatter.updatedAt || frontmatter.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));
  return [...pages, ...insights];
}
