import type { Metadata } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://airalexo.in").replace(/\/$/, "");

export const founders = [
  {
    slug: "edwin-swanith",
    name: "Edwin Swanith",
    role: "Co-founder",
    area: "Technology & Integrations",
    bio: "Edwin leads Aira's technical architecture, product engineering, and integrations. He is responsible for connecting the recorder, review workflow, and supporting systems into a dependable end-to-end product.",
    imagePath: "/images/founders/edwin-swanith.webp",
    linkedInUrl: "https://www.linkedin.com/in/edwinswanith/",
  },
  {
    slug: "dr-pon-shamli-duraisamy",
    name: "Dr. Pon Shamli Duraisamy",
    role: "Co-founder & Director",
    area: "Clinical Research & Operations",
    bio: "Dr. Shamli is a BNYS physician, Yoga and Naturopathy Doctor, and Advanced Ozone Therapy Practitioner with over seven years of clinical and wellness experience. At Aira, she leads clinical research and operations, working directly with doctors to turn feedback into responsible product decisions.",
    imagePath: "/images/founders/dr-pon-shamli-duraisamy.webp",
    linkedInUrl: "https://www.linkedin.com/in/dr-pon-shamli-duraisamy-806499280/",
  },
  {
    slug: "raghul-senthilnathan",
    name: "Raghul Senthilnathan",
    role: "Co-founder",
    area: "Product & Design",
    bio: "Raghul leads product design and experience across Aira. Based in the UK, he brings founder experience from Cogniverse Limited and translates clinical and technical requirements into clear, usable product experiences.",
    imagePath: "/images/founders/raghul-senthilnathan.webp",
    linkedInUrl: "https://www.linkedin.com/in/raghul-snn/",
  },
] as const;

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
