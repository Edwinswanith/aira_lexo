import type { MetadataRoute } from "next";
import { isIndexableDeployment, site } from "@/lib/site";

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
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
