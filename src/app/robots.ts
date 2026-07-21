import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexableDeployment, site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexableDeployment) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      { userAgent: ["Googlebot", "Bingbot", "ChatGPT-User", "OAI-SearchBot"], allow: "/", disallow: "/api/" },
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}
