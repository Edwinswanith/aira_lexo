import type { Metadata } from "next";

export const site = {
  name: "Aira",
  legalName: "Aira Lexo Solutions Private Limited",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://airalexo.in",
  description: "A doctor-controlled consultation memory system designed for consent, structured review, and better context at return visits.",
};

export function pageMetadata(title: string, description: string, path = ""): Metadata {
  const url = new URL(path, site.url).toString();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: "en_IN",
      type: "website",
      images: [{ url: "/images/hero-device.png", width: 1400, height: 1200, alt: "Concept render of the Aira consultation recorder" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/hero-device.png"],
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, site.url).toString(),
    })),
  };
}
