import { FeatureRows, PageHero, PilotCta } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Consultation memory for doctors", "See how Aira is designed to support consent-first capture, structured draft review, repeat visits, and doctor control.", "/for-doctors");

export default function DoctorsPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="For Doctors" path="/for-doctors" title="Stay with the patient. Keep control of the record." description="Aira is designed for doctors who want stronger consultation continuity without handing clinical judgment to software." />
      <section className="section"><div className="container"><FeatureRows items={[
        ["01", "Attention in the room", "A dedicated recorder is intended to reduce the need to manage a phone or type throughout the conversation."],
        ["02", "A structured starting point", "The draft organizes what was discussed so review can begin from a useful structure instead of a blank page."],
        ["03", "Context for repeat visits", "Approved records can help recover the reasoning, concerns, and follow-up plan from an earlier consultation."],
        ["04", "Doctor control", "The doctor reviews and approves the record. Aira does not diagnose, prescribe, or make autonomous clinical decisions."],
      ]} /></div></section>
      <section className="section dark-section"><div className="container split"><div><p className="eyebrow" style={{ color: "var(--mint)" }}>A careful pilot</p><h2>Measure whether it helps, and where it gets in the way.</h2><p className="lead">The pilot should examine consent clarity, capture reliability, review effort, correction needs, usefulness at return visits, and the effect on the consultation experience.</p></div><div className="record-preview" style={{ color: "var(--ink)" }}><div className="record-topline"><span>PILOT QUESTION</span><span className="approved">DOCTOR LED</span></div><div className="record-grid"><div className="record-field"><strong>Was consent clear?</strong><p>Patients should understand the purpose and have a real choice.</p></div><div className="record-field"><strong>Was the draft useful?</strong><p>Doctors should be able to review, correct, and approve it efficiently.</p></div><div className="record-field"><strong>Did it preserve context?</strong><p>The approved record should be useful when the patient returns.</p></div><div className="record-field"><strong>What should change?</strong><p>Qualitative feedback is part of the product decision, not an afterthought.</p></div></div></div></div></section>
      <PilotCta />
    </main>
  );
}
