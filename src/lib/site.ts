import type { Metadata } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://airalexo.in").replace(/\/$/, "");

export const site = {
  name: "Aira",
  alternateName: "Aira Lexo",
  legalName: "Aira Lexo Solutions Private Limited",
  url: siteUrl,
  locale: "en_IN",
  language: "en-IN",
  description: "A doctor-controlled consultation memory system designed for consent, structured review, and better context at return visits.",
  organizationId: `${siteUrl}/#organization`,
  websiteId: `${siteUrl}/#website`,
  logoUrl: `${siteUrl}/images/aira-logo-mark.png`,
  socialImageUrl: `${siteUrl}/images/hero-device.png`,
  pilotCities: ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Coimbatore"],
  topics: [
    "consultation memory",
    "doctor-reviewed clinical documentation",
    "consultation recording consent",
    "structured consultation records",
    "return-visit context",
  ],
} as const;

export const isIndexableDeployment = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;

export function absoluteUrl(path = "") {
  return new URL(path || "/", `${site.url}/`).toString();
}

export function pageMetadata(title: string, description: string, path = ""): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { "en-IN": url },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
      type: "website",
      images: [{ url: site.socialImageUrl, width: 1400, height: 1200, alt: "Concept render of the Aira consultation recorder" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [site.socialImageUrl],
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const pageUrl = absoluteUrl(items.at(-1)?.path || "/");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageJsonLd({
  title,
  description,
  path,
  type = "WebPage",
  includeBreadcrumb = true,
}: {
  title: string;
  description: string;
  path: string;
  type?: "WebPage" | "AboutPage" | "CollectionPage";
  includeBreadcrumb?: boolean;
}) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: site.language,
    isPartOf: { "@id": site.websiteId },
    about: { "@id": site.organizationId },
    ...(includeBreadcrumb ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
  };
}
