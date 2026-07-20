import Link from "next/link";
import { JsonLd } from "./json-ld";
import { breadcrumbJsonLd } from "@/lib/site";

export function PageHero({ eyebrow, title, description, path }: { eyebrow: string; title: string; description: string; path: string }) {
  return (
    <section className="page-hero">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: eyebrow, path }])} />
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
      </div>
    </section>
  );
}

export function FeatureRows({ items }: { items: Array<[string, string, string]> }) {
  return (
    <div className="feature-list">
      {items.map(([number, title, text]) => <div className="feature-row" key={title}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}
    </div>
  );
}

export function PilotCta() {
  return (
    <section className="section">
      <div className="container">
        <div className="pilot-banner">
          <p className="eyebrow" style={{ color: "white" }}>Clinical pilot</p>
          <h2>Bring your clinical perspective to Aira.</h2>
          <p>We are looking for doctors and clinic teams who want to test the workflow carefully and tell us what needs to improve.</p>
          <div className="button-row"><Link className="button plausible-event-name=pilot_cta_click" href="/pilot">Join the Clinical Pilot</Link></div>
        </div>
      </div>
    </section>
  );
}
