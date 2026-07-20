import { PageHero, PilotCta } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("About", "Meet Aira, a prototype-stage consultation memory system from Aira Lexo Solutions Private Limited.", "/about");

export default function AboutPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="About" path="/about" title="Building consultation memory around clinical responsibility." description="Aira is a new Indian health technology company working on a doctor-controlled way to capture, review, and recover consultation context." />
      <section className="section"><div className="container split"><div><p className="eyebrow">Why Aira</p><h2>The problem is not simply transcription.</h2><p className="lead">A return visit often depends on the meaning behind an earlier conversation. We are exploring how a focused recorder and a careful review workflow can preserve that context without moving clinical decisions away from the doctor.</p></div><div className="card-grid" style={{ gridTemplateColumns: "1fr" }}><article className="card"><span className="card-number">TODAY</span><h3>Prototype and pilot preparation</h3><p>Product renders are concepts. Capabilities described on this site will be tested through technical, clinical, legal, and operational review.</p></article><article className="card"><span className="card-number">COMPANY</span><h3>Aira Lexo Solutions Private Limited</h3><p>Aira is the public brand. The legal company name appears in policies, applications, and formal agreements.</p></article></div></div></section>
      <section className="section dark-section"><div className="container"><div className="section-heading"><p className="eyebrow" style={{ color: "var(--mint)" }}>How we plan to learn</p><h2>Build with clinicians. Validate before claiming.</h2></div><div className="card-grid"><article className="card" style={{ background: "#101d2b", borderColor: "rgba(255,255,255,.12)" }}><h3>Clinical input</h3><p>Doctors and clinic teams help define useful records, safe boundaries, and real workflow constraints.</p></article><article className="card" style={{ background: "#101d2b", borderColor: "rgba(255,255,255,.12)" }}><h3>Pilot evidence</h3><p>We separate what the category suggests from what Aira itself has actually demonstrated.</p></article><article className="card" style={{ background: "#101d2b", borderColor: "rgba(255,255,255,.12)" }}><h3>Transparent progress</h3><p>When evidence changes, we update public content with dates, sources, and named reviewers where clinical review is needed.</p></article></div></div></section>
      <PilotCta />
    </main>
  );
}
