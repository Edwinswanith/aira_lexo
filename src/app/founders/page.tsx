import Image from "next/image";
import { ArrowUpRight, LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { JsonLd } from "@/components/json-ld";
import { PageHero, PilotCta } from "@/components/page-sections";
import { absoluteUrl, founders, pageMetadata, site } from "@/lib/site";

const title = "The founders responsible for building Aira";
const description = "Meet Aira's three founders and see who leads clinical research and operations, product design, and technical integrations.";

export const metadata = pageMetadata(title, description, "/founders");

const founderListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": `${site.url}/founders#founding-team`,
  name: "Founders of Aira",
  numberOfItems: founders.length,
  itemListElement: founders.map((founder, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Person",
      "@id": `${site.url}/founders#${founder.slug}`,
      name: founder.name,
      jobTitle: `${founder.role}, ${founder.area}`,
      description: founder.bio,
      image: absoluteUrl(founder.imagePath),
      sameAs: [founder.linkedInUrl],
      worksFor: { "@id": site.organizationId },
    },
  })),
};

const responsibilities = [
  ["01", "Clinical learning", "Dr. Shamli leads doctor conversations, field research, feedback collection, and day-to-day operating coordination."],
  ["02", "Product experience", "Raghul turns clinical and technical requirements into the product, interaction, and design decisions people experience."],
  ["03", "Technical delivery", "Edwin leads the architecture, engineering, and integrations that connect the Aira system from device to review workflow."],
] as const;

const shamliBiography = [
  "Dr. Pon Shamli Duraisamy is a BNYS (Bachelor of Naturopathy and Yogic Sciences) physician, Yoga and Naturopathy Doctor, and an Advanced Ozone Therapy Practitioner with over seven years of clinical and wellness experience. She is passionate about integrating evidence-based natural medicine with emerging technologies to create accessible, personalized healthcare solutions.",
  "As Co-founder and Director of Aira Lexo Solutions Private Limited, the company behind Aira, she is committed to exploring how artificial intelligence can support preventive healthcare, holistic wellness, and patient engagement. Her vision is to bridge traditional healing sciences and modern AI-driven innovation, helping make personalized, data-informed care more accessible.",
  "Her expertise spans yoga therapy, naturopathy, lifestyle medicine, and ozone therapy. Dr. Shamli's approach emphasizes understanding contributing factors behind health concerns and empowering people to build sustainable wellness habits. Her long-term vision through Aira is to make intelligent, holistic healthcare more accessible, effective, and impactful for people around the world.",
] as const;

export default function FoundersPage() {
  return (
    <main id="main-content">
      <JsonLd data={founderListJsonLd} />
      <PageHero
        eyebrow="Founders"
        path="/founders"
        schemaType="AboutPage"
        title="Meet the people accountable for Aira."
        description="Aira is led by three founders across clinical research and operations, product design, and technology. Every founder below links to an independent public LinkedIn profile."
      />

      <section className="section" aria-labelledby="founding-team-heading">
        <div className="container">
          <div className="founder-page-intro">
            <div>
              <p className="eyebrow">Founding team</p>
              <h2 id="founding-team-heading">Three disciplines. One responsible product.</h2>
            </div>
            <p className="lead">The team combines direct clinical discovery, product design, and technical delivery. These are the people responsible for how Aira is researched, designed, built, and prepared for pilot use.</p>
          </div>

          <div className="founder-grid">
            {founders.map((founder, index) => (
              <article className="founder-card" id={founder.slug} key={founder.slug}>
                <div className="founder-portrait">
                  <Image
                    src={founder.imagePath}
                    alt={`Professional portrait of ${founder.name}, ${founder.role} at Aira`}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 720px) calc(100vw - 28px), (max-width: 980px) 40vw, 33vw"
                  />
                </div>
                <div className="founder-card-copy">
                  <p className="founder-role">{founder.role}</p>
                  <h2>{founder.name}</h2>
                  <p className="founder-area">{founder.area}</p>
                  <p className="founder-bio">{founder.bio}</p>
                  <a
                    className="founder-link"
                    href={founder.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${founder.name}'s public LinkedIn profile`}
                  >
                    <LinkedinLogo size={20} weight="fill" aria-hidden="true" />
                    View LinkedIn profile
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          <section className="founder-profile-detail" id="dr-pon-shamli-duraisamy-biography" aria-labelledby="shamli-biography-heading">
            <div>
              <p className="eyebrow">Professional background</p>
              <h2 id="shamli-biography-heading">Dr. Pon Shamli Duraisamy</h2>
              <p className="founder-profile-credentials">BNYS physician, Yoga and Naturopathy Doctor, and Advanced Ozone Therapy Practitioner</p>
            </div>
            <div className="founder-profile-copy">
              {shamliBiography.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <a
                className="founder-link"
                href="https://www.linkedin.com/in/dr-pon-shamli-duraisamy-806499280/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Dr. Pon Shamli Duraisamy's public LinkedIn profile"
              >
                <LinkedinLogo size={20} weight="fill" aria-hidden="true" />
                View LinkedIn profile
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>
      </section>

      <section className="section dark-section" aria-labelledby="responsibility-heading">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow" style={{ color: "var(--mint)" }}>Operational ownership</p>
            <h2 id="responsibility-heading">Clear responsibility from clinical learning to working systems.</h2>
            <p className="lead">The founders work across distinct areas, with shared review where product decisions affect clinical workflow, usability, privacy, or technical delivery.</p>
          </div>
          <div className="founder-responsibility-grid">
            {responsibilities.map(([number, heading, text]) => (
              <article key={heading}>
                <span>{number}</span>
                <h3>{heading}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container founder-verification-note">
          <div>
            <p className="eyebrow">External verification</p>
            <h2>Public profiles, linked directly.</h2>
          </div>
          <div>
            <p className="lead">Each founder card links directly to that person's public LinkedIn profile. These third-party links make it possible to review professional background outside the Aira website.</p>
            <p className="muted">For questions about the legal entity or this page, contact <a className="inline-link" href="mailto:legal@airalexo.in">legal@airalexo.in</a>.</p>
          </div>
        </div>
      </section>

      <PilotCta />
    </main>
  );
}
