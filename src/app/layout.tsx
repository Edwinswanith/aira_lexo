import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/site";
import "./globals.css";

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
  robots: { index: true, follow: true },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  alternateName: "Aira Lexo",
  url: site.url,
  inLanguage: "en-IN",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  alternateName: "Aira Lexo",
  legalName: site.legalName,
  url: site.url,
  logo: `${site.url}/images/aira-logo-mark.png`,
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
