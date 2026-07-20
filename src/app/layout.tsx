import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import { isIndexableDeployment, site } from "@/lib/site";
import "./globals.css";

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Aira | Consultation memory for doctors", template: "%s | Aira" },
  description: site.description,
  applicationName: "Aira",
  authors: [{ name: "Aira Lexo Solutions Private Limited" }],
  creator: "Aira Lexo Solutions Private Limited",
  icons: {
    icon: "/images/aira-logo-mark-256.png",
    apple: "/images/aira-logo-mark-256.png",
  },
  robots: isIndexableDeployment
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : { index: false, follow: false },
  verification: googleVerification || bingVerification
    ? {
        google: googleVerification,
        other: bingVerification ? { "msvalidate.01": bingVerification } : undefined,
      }
    : undefined,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": site.websiteId,
  name: site.name,
  alternateName: site.alternateName,
  url: site.url,
  description: site.description,
  inLanguage: site.language,
  publisher: { "@id": site.organizationId },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": site.organizationId,
  name: site.name,
  alternateName: site.alternateName,
  legalName: site.legalName,
  url: site.url,
  description: site.description,
  logo: {
    "@type": "ImageObject",
    url: site.logoUrl,
    contentUrl: site.logoUrl,
    caption: "Aira logo",
  },
  areaServed: site.pilotCities.map((name) => ({
    "@type": "City",
    name,
    containedInPlace: { "@type": "Country", name: "India" },
  })),
  knowsAbout: site.topics,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <head>
        <link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <JsonLd data={[websiteJsonLd, organizationJsonLd]} />
        <Header />
        {children}
        <Footer />
        {plausibleDomain && (
          <Script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.tagged-events.js" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
