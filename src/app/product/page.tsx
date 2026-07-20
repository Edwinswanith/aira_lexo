import Image from "next/image";
import { FeatureRows, PageHero, PilotCta } from "@/components/page-sections";
import { PrototypeGallery } from "@/components/prototype-gallery";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Consultation recorder and review workflow", "Explore Aira's pilot-stage recorder, doctor review app, structured consultation draft, and return-visit context workflow.", "/product");

const device: Array<[string, string, string]> = [
  ["01", "One-button operation", "A simple physical control is intended to make the beginning and end of capture unmistakable."],
  ["02", "Visible status", "The e-paper display and light ring communicate whether the device is ready, recording, saved, syncing, or needs attention."],
  ["03", "Local storage", "The concept includes local storage so a temporary connection issue does not need to interrupt a consultation."],
  ["04", "Secure review", "The review experience is separate from the recorder so the doctor can focus on the patient first, then inspect the draft."],
];

export default function ProductPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Product" path="/product" title="A dedicated recorder and a doctor-controlled review flow." description="Aira is being designed around a simple idea: capture the conversation with consent, make the state visible, and give the doctor the final say over the record." />
      <section className="section">
        <div className="container">
          <div className="product-image-wide">
            <Image src="/images/device-details.png" alt="Concept composition showing front, back, and side views of the Aira recorder" fill priority sizes="100vw" />
            <span className="concept-label">Concept render. Final product may vary.</span>
          </div>
        </div>
      </section>
      <section className="section-tight">
        <div className="container split">
          <div><p className="eyebrow">The recorder</p><h2>Small enough to stay out of the way.</h2><p className="lead">The compact hardware concept uses a matte black body, a small status display, a microphone opening, an illuminated control, and charging contacts. It is a pilot-stage design, not a finished medical device.</p></div>
          <FeatureRows items={device} />
        </div>
      </section>
      <section className="section prototype-section" id="working-prototype">
        <div className="container">
          <div className="prototype-intro">
            <div>
              <p className="eyebrow">Working prototype</p>
              <h2>Before the polished concept, there was a device we could hold.</h2>
            </div>
            <div>
              <p className="lead">This early build helped us explore e-paper states, physical controls, recording and playback flows, port placement, and enclosure size.</p>
              <p>The temporary Neura name appears on its screen. It is part of Aira&apos;s prototype history, not a separate public brand.</p>
              <p className="notice">Early working prototype. Interface, materials, naming, and enclosure are not final.</p>
            </div>
          </div>
          <PrototypeGallery />
        </div>
      </section>
      <section className="section dark-section">
        <div className="container">
          <div className="section-heading"><p className="eyebrow" style={{ color: "var(--mint)" }}>The review app</p><h2>Draft, review, approve, retrieve.</h2><p className="lead">The software workflow is intended to organize consultation content for doctor review. It does not replace clinical judgment.</p></div>
          <div className="workflow-grid">
            {[["01","Draft","The consultation is grouped into useful record sections."],["02","Review","The doctor checks wording, context, and omissions."],["03","Approve","Only the reviewed version becomes approved context."],["04","Retrieve","Approved context is available when a patient returns."],["05","Correct","Authorized users can address errors through a documented workflow."],["06","Control","Retention and access follow the clinic's agreed pilot settings."]].map(([n,t,p]) => <div className="workflow-step" key={t}><span>{n}</span><h3>{t}</h3><p>{p}</p></div>)}
          </div>
        </div>
      </section>
      <PilotCta />
    </main>
  );
}
