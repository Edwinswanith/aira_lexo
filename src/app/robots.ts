import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexableDeployment, site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexableDeployment) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      { userAgent: ["Googlebot", "Bingbot", "ChatGPT-User", "OAI-SearchBot", "GPTBot"], allow: "/" },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}
