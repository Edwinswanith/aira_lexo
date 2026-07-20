import Link from "next/link";
import { FeatureRows, PageHero, PilotCta } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Trust", "Aira's pilot-stage approach to consent, privacy, security, access, retention, deletion, auditability, and doctor approval.", "/trust");

export default function TrustPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Trust" path="/trust" title="Clinical memory deserves clear controls and honest limits." description="Aira is being designed to make consent visible, keep access purposeful, and leave the approved clinical record under doctor control." />
      <section className="section"><div className="container"><FeatureRows items={[
        ["01", "Consent", "Patients should receive a plain-language explanation before recording and retain the ability to decline."],
        ["02", "Encryption", "Production data will use encrypted transport and managed encryption at rest. Final technical controls will be documented before deployment."],
        ["03", "Access control", "Only authorized people should access consultation content, according to their role and the agreed clinic workflow."],
        ["04", "Retention", "Pilot participants will receive a defined retention schedule. Website pilot applications are retained for up to 12 months."],
        ["05", "Deletion", "People can request deletion through the published privacy contact, subject to applicable legal and clinical record obligations."],
        ["06", "Auditability", "Important actions such as access, review, approval, and deletion should be attributable and available for review."],
        ["07", "Doctor approval", "A machine-prepared draft is not treated as an approved clinical record until the doctor has reviewed it."],
      ]} /><p className="notice" style={{ marginTop: 34 }}>Aira does not currently claim certification or compliance with a specific healthcare standard. Those claims require completed legal, security, and deployment review.</p></div></section>
      <section className="section dark-section"><div className="container split"><div><p className="eyebrow" style={{ color: "var(--mint)" }}>Patient clarity</p><h2>Consent should be understood, not buried.</h2><p className="lead">The person being recorded should know what the recording is for, who can access it, what happens if they decline, and how to ask questions about their information.</p></div><div><Link className="button" style={{ borderColor: "white", color: "white" }} href="/patient-information">Read Patient Information</Link></div></div></section>
      <PilotCta />
    </main>
  );
}
