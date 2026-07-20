import { FeatureRows, PageHero, PilotCta } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("For Clinics", "Understand Aira's proposed onboarding, access, deployment, export, and clinic pilot support.", "/for-clinics");

export default function ClinicsPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="For Clinics" path="/for-clinics" title="Introduce consultation memory as a managed clinical workflow." description="A clinic pilot needs more than a device. It needs clear ownership, patient communication, review responsibilities, support, and evidence that the workflow fits." />
      <section className="section"><div className="container"><div className="section-heading"><p className="eyebrow">Clinic readiness</p><h2>What a responsible deployment should define.</h2></div><FeatureRows items={[
        ["01", "Onboarding", "Participating doctors and staff receive a shared workflow for consent, recording, review, access, and escalation."],
        ["02", "User management", "Clinics define authorized users and keep access aligned with each person's responsibility."],
        ["03", "Export and records", "Export requirements will be agreed during pilot setup. Future integrations are outside the first website release."],
        ["04", "Deployment support", "The pilot plan should include device setup, patient communication, incident handling, feedback, and regular review."],
        ["05", "Measurement", "Operational fit, doctor review effort, consent clarity, and record usefulness are assessed before wider use."],
      ]} /></div></section>
      <section className="section" style={{ background: "#efebe2" }}><div className="container split"><div><p className="eyebrow">Not promised at launch</p><h2>Clear scope protects the pilot.</h2><p className="lead">The first pilot does not include EHR integration, ABDM integration, billing, multilingual content, clinician dashboards, or autonomous clinical actions. These are future decisions, not hidden launch claims.</p></div><div className="card-grid" style={{ gridTemplateColumns: "1fr" }}><article className="card"><h3>Start with the workflow</h3><p>Test consent, capture, transfer, review, approval, retrieval, access, and deletion in a controlled setting.</p></article><article className="card"><h3>Expand only with evidence</h3><p>Broader deployment should follow clinical, operational, security, and legal review of what the pilot actually shows.</p></article></div></div></section>
      <PilotCta />
    </main>
  );
}
