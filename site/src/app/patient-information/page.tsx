import { PageHero } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Patient Information", "Plain-language information about the intended Aira consultation recording workflow, consent, access, refusal, and data rights.", "/patient-information");

export default function PatientInformationPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Patient Information" path="/patient-information" title="If a consultation is recorded, you should know exactly why." description="This page describes the intended Aira pilot workflow in plain language. A participating clinic should also explain its specific process before any recording begins." />
      <section className="legal">
        <h2>What Aira is for</h2>
        <p>Aira is being designed to help a doctor capture a consultation, review a structured draft record, and find approved context when you return. It is not intended to diagnose, prescribe, or replace your doctor.</p>
        <h2>Before recording begins</h2>
        <p>The doctor or clinic should explain that recording is proposed, what it will be used for, who may access it, and how long it may be kept. You should have the chance to ask questions before deciding.</p>
        <h2>You can decline</h2>
        <p>You can say no to recording. Declining should not prevent you from receiving the consultation. The clinic should explain how it will document your visit without Aira.</p>
        <h2>Who can access the information</h2>
        <p>Access should be limited to authorized people who need it for the agreed clinical workflow, support, or legal responsibilities. The clinic should tell you which organization is responsible for the record.</p>
        <h2>Doctor review</h2>
        <p>Software may prepare a structured draft, but the doctor is expected to review and approve the clinical record. Aira should not make an autonomous clinical decision about your care.</p>
        <h2>Questions, corrections, and deletion</h2>
        <p>Ask the participating clinic how to request access, correction, or deletion. Some information may need to be retained when law or clinical record duties require it. Website privacy questions can be sent to <a href="mailto:privacy@airalexo.in">privacy@airalexo.in</a>.</p>
        <p className="notice">Aira is at the prototype and pilot preparation stage. The final patient information notice will be reviewed for each live pilot before clinical use.</p>
      </section>
    </main>
  );
}
