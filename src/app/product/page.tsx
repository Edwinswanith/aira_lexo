import Image from "next/image";
import { FeatureRows, PageHero, PilotCta } from "@/components/page-sections";
import Link from "next/link";
import { isStoreEnabled } from "@/lib/store";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Consultation recorder and review workflow", "Explore Aira's pilot-stage recorder, doctor review app, structured consultation draft, and return-visit context workflow.", "/product");

const device: Array<[string, string, string]> = [
  ["01", "One-button operation", "A simple physical control is intended to make the beginning and end of capture unmistakable."],
  ["02", "Ready light", "The button glows amber when the recorder is ready, so you know it can start before the patient sits down."],
  ["03", "Local storage", "The concept includes local storage so a temporary connection issue does not need to interrupt a consultation."],
  ["04", "Secure review", "The review experience is separate from the recorder so the doctor can focus on the patient first, then inspect the draft."],
];

export default function ProductPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Product" path="/product" title="A dedicated recorder and a doctor-controlled review flow." description="Aira is being designed around a simple idea: capture the conversation with consent, make the state visible, and give the doctor the final say over the record." />
      <section className="section">
        <div className="container">
          <div className="product-photo-grid">
            {[
              ["/images/product/aira-10-top-real.webp", "The Aira recorder from above, with its single button and charging indicator"],
              ["/images/product/aira-11-usb-c-real.webp", "The Aira recorder side view showing the USB-C port in its recess"],
              ["/images/product/aira-12-underside-real.webp", "The textured underside of the Aira recorder"],
            ].map(([src, alt], index) => (
              <div className="photo-frame" key={src}>
                <Image src={src} alt={alt} fill priority={index === 0} sizes="(max-width: 980px) 100vw, 33vw" />
              </div>
            ))}
          </div>
          <p className="photo-caption">Real product photos. Studio backdrop extended to fit.</p>
        </div>
      </section>
      <section className="section-tight">
        <div className="container split">
          <div><p className="eyebrow">The recorder</p><h2>Small enough to stay out of the way.</h2><p className="lead">The recorder has a compact matte black body with a textured top, a single button that glows amber when ready, USB-C charging with a charging indicator, and a badge-holder slot so it can be worn. It is a pilot-stage design, not a finished medical device.</p>{isStoreEnabled() && <div className="button-row"><Link className="button button-violet" href="/buy">Buy Aira</Link></div>}</div>
          <FeatureRows items={device} />
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
