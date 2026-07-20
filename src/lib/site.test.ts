import { describe, expect, it } from "vitest";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, site, webPageJsonLd } from "./site";

describe("site search metadata", () => {
  it("builds canonical URLs from the production origin", () => {
    expect(absoluteUrl("/trust")).toBe("https://airalexo.in/trust");
    expect(absoluteUrl("/")).toBe("https://airalexo.in/");
  });

  it("adds canonical and language alternatives", () => {
    const metadata = pageMetadata("Trust", "How Aira handles consent and doctor control.", "/trust");
    expect(metadata.alternates).toEqual({
      canonical: "https://airalexo.in/trust",
      languages: { "en-IN": "https://airalexo.in/trust" },
    });
  });

  it("connects page and breadcrumb schema through stable identifiers", () => {
    const breadcrumb = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Trust", path: "/trust" },
    ]);
    const page = webPageJsonLd({ title: "Trust", description: "Trust information", path: "/trust" });

    expect(breadcrumb["@id"]).toBe("https://airalexo.in/trust#breadcrumb");
    expect(page.breadcrumb).toEqual({ "@id": "https://airalexo.in/trust#breadcrumb" });
    expect(page.isPartOf).toEqual({ "@id": site.websiteId });
  });
});
