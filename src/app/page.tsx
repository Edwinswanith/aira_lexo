import Image from "next/image";
import Link from "next/link";
import { DeviceStateSimulator, PerspectiveSwitcher, TrustStrip } from "@/components/interactions";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata, site, webPageJsonLd } from "@/lib/site";

const homeTitle = "AI consultation memory for doctors in India";
const homeDescription = "Aira is a doctor-controlled AI consultation memory system for consent-first capture, structured draft review, and approved context at return visits.";

export const metadata = pageMetadata(
  homeTitle,
  homeDescription,
  "/",
);

const workflow = [
  ["01", "Consent", "The doctor explains recording and confirms the patient agrees."],
  ["02", "Capture", "One clear action begins the consultation recording."],
  ["03", "Secure sync", "The consultation moves to the review app when a connection is available."],
  ["04", "Structure", "A draft groups the details that matter for follow-up."],
  ["05", "Doctor approval", "The doctor reviews, corrects, and approves the record."],
  ["06", "Return visit", "Approved context is ready when the patient comes back."],
];

const problems = [
  ["01", "High consultation volume", "A full clinic day leaves little room for detailed notes between patients."],
  ["02", "Fragmented documentation", "Context can sit across paper, memory, messages, and disconnected systems."],
  ["03", "Thin return-visit context", "The reason behind a past decision is often harder to recover than the decision itself."],
  ["04", "Work after clinic hours", "Important documentation can spill into the time doctors need to rest."],
];

const trustPrinciples = [
  ["Consent", "Recording begins only after the patient receives a clear explanation and agrees."],
  ["Access", "Access should be limited to the people responsible for the patient and the approved record."],
  ["Retention", "Pilot policies define how long recordings and records are kept."],
  ["Deletion", "Requests are handled through a published privacy contact and a documented process."],
  ["Auditability", "Important actions should be visible and attributable to authorized users."],
  ["Doctor approval", "A structured draft is not the final clinical record until the doctor reviews it."],
];

const faqs = [
  {
    question: "Does Aira diagnose or prescribe?",
    answer: "No. Aira is designed to support consultation capture, structured drafting, doctor review, and later retrieval. Diagnosis, prescribing, and treatment decisions remain with the doctor.",
  },
  {
    question: "Does a patient have to agree to recording?",
    answer: "Yes. The intended workflow starts with a clear explanation and patient consent. A patient can decline without losing access to the consultation.",
  },
  {
    question: "Is the product available today?",
    answer: "Aira is at the prototype and pilot preparation stage. Product renders and described capabilities are concepts until they are validated in the pilot.",
  },
  {
    question: "What will the pilot measure?",
    answer: "The pilot is intended to examine workflow fit, consent clarity, review effort, record usefulness, and safe use in real clinical settings. Final measures will be agreed with participating clinicians.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${site.url}/#frequently-asked-questions`,
  mainEntity: faqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export default function Home() {
  return (
    <main id="main-content">
      <JsonLd data={[
        webPageJsonLd({ title: homeTitle, description: homeDescription, path: "/", includeBreadcrumb: false }),
        faqJsonLd,
      ]} />
      <section className="container hero">
        <div className="hero-copy">
          <p className="eyebrow">Consultation memory for doctors</p>
          <h1>Your consultation memory, ready when the patient returns.</h1>
          <p className="lead">Aira captures a consultation with consent, prepares a structured draft for doctor review, and brings the approved context back at the next visit.</p>
          <div className="button-row">
            <Link className="button button-violet plausible-event-name=pilot_cta_click" href="/pilot" prefetch={false}>Join the Clinical Pilot</Link>
            <Link className="button button-secondary" href="#how-it-works" prefetch={false}>See How Aira Works</Link>
          </div>
          <p className="concept-note">Concept render. Final product may vary.</p>
        </div>
        <div className="hero-visual">
          <div className="hero-image-shell">
            <Image src="/images/hero-device.png" alt="Concept render of the compact black Aira recorder beside pale limestone" fill priority sizes="(max-width: 980px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <TrustStrip />

      <section className="section-tight">
        <div className="container split">
          <div>
            <p className="eyebrow">What is Aira?</p>
            <h2>A doctor-controlled AI consultation memory system.</h2>
          </div>
          <div>
            <p className="lead">Aira is a pilot-stage system for doctors and clinics. With patient consent, the intended workflow captures a consultation, prepares a structured draft, and lets the doctor review, correct, and approve it before the context is reused.</p>
            <p>Aira does not diagnose, prescribe, or replace clinical judgment. Product capabilities described on this website remain subject to pilot validation, legal review, and clinical review.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">The current problem</p>
            <h2>The visit moves quickly. The context should not disappear.</h2>
            <p className="lead">Clinical work depends on details, but the normal rhythm of a busy practice makes those details difficult to capture and retrieve.</p>
          </div>
          <div className="card-grid four">
            {problems.map(([number, title, text]) => (
              <article className="card" key={title}>
                <span className="card-number">{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark-section" id="how-it-works">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow" style={{ color: "var(--mint)" }}>How Aira works</p>
            <h2>One responsible path from conversation to continuity.</h2>
            <p className="lead">The workflow keeps the doctor in control at each point where clinical meaning is created or reused.</p>
          </div>
          <div className="workflow-grid">
            {workflow.map(([number, title, text]) => (
              <div className="workflow-step" key={title}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <p className="eyebrow">Visible device states</p>
            <h2>Quiet in the room. Clear when it matters.</h2>
            <p className="lead">A compact e-paper display and a single illuminated control communicate what the recorder is doing without turning the consultation into a screen-led experience.</p>
            <p className="notice">These states describe the intended pilot experience. Final hardware behaviour will be validated before clinical deployment.</p>
          </div>
          <DeviceStateSimulator />
        </div>
      </section>

      <section className="section" style={{ background: "#efebe2" }}>
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Structured record</p>
            <h2>A draft built for review, not blind acceptance.</h2>
            <p className="lead">Aira groups consultation context so the doctor can find, correct, and approve the important details.</p>
          </div>
          <div className="record-preview">
            <div className="record-topline"><span>RETURN VISIT CONTEXT</span><span className="approved">DOCTOR APPROVED</span></div>
            <div className="record-grid">
              <div className="record-field"><strong>Concerns and symptoms</strong><p>Patient-reported concerns, timing, and changes discussed during the consultation.</p></div>
              <div className="record-field"><strong>Clinical context</strong><p>Relevant background and observations documented for the doctor to verify.</p></div>
              <div className="record-field"><strong>Medication and care</strong><p>Medication and care details as stated, with no autonomous treatment recommendation.</p></div>
              <div className="record-field"><strong>Follow-up actions</strong><p>Next steps agreed in the room, prepared for confirmation before they become part of the record.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <p className="eyebrow">The return visit</p>
            <h2>Remember the thread, not only the last line.</h2>
            <p className="lead">Aira is designed to make approved context easier to retrieve when a patient comes back, while leaving interpretation and clinical decisions with the doctor.</p>
          </div>
          <div className="timeline">
            <div className="timeline-item"><time>INITIAL CONSULTATION</time><h3>The concern is explored</h3><p className="muted">The consultation is captured with consent. A structured draft is prepared and reviewed by the doctor.</p></div>
            <div className="timeline-item"><time>DOCTOR REVIEW</time><h3>The record becomes reliable context</h3><p className="muted">Corrections and approvals preserve what the doctor considers meaningful.</p></div>
            <div className="timeline-item"><time>RETURN VISIT</time><h3>The approved story is available</h3><p className="muted">Past context is presented for reference. Aira does not produce an autonomous diagnosis or prescription.</p></div>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container split">
          <div>
            <p className="eyebrow">Device and review app</p>
            <h2>Made to support attention, not compete for it.</h2>
            <p className="lead">The dedicated recorder offers one-button operation, visible status, and local storage. The secure review app is where the doctor examines the structured draft and approves what can be reused.</p>
            <div className="button-row">
              <Link className="button button-secondary" href="/product">Explore the product</Link>
              <Link className="button button-secondary" href="/product#working-prototype">See the working prototype</Link>
            </div>
          </div>
          <div className="lifestyle-image">
            <Image src="/images/consultation-desk.png" alt="Warm editorial still life with a notebook, pen, and ceramic cup" fill sizes="(max-width: 980px) 100vw, 55vw" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <p className="eyebrow">Three perspectives</p>
            <h2>A responsible system has more than one user.</h2>
            <p className="lead">Doctors, clinic teams, and patients experience consultation recording differently. The product and the pilot need to respect each perspective.</p>
          </div>
          <PerspectiveSwitcher />
        </div>
      </section>

      <section className="section dark-section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow" style={{ color: "var(--mint)" }}>Trust by design</p>
            <h2>Useful memory starts with clear boundaries.</h2>
          </div>
          <div className="card-grid">
            {trustPrinciples.map(([title, text]) => <article className="card" style={{ background: "#101d2b", borderColor: "rgba(255,255,255,.12)" }} key={title}><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="button-row"><Link className="button" style={{ borderColor: "white", color: "white" }} href="/trust">Read our trust approach</Link></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="pilot-banner">
            <p className="eyebrow" style={{ color: "white" }}>Clinical pilot</p>
            <h2>Help shape a more useful consultation memory.</h2>
            <p>We are inviting qualified doctors and clinics in Chennai, Bengaluru, Hyderabad, Mumbai, and Coimbatore to explore the pilot. Applications from other cities join our future-access list.</p>
            <div className="button-row"><Link className="button plausible-event-name=pilot_cta_click" href="/pilot">Apply for the Pilot</Link></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading" style={{ marginInline: "auto", textAlign: "center" }}><p className="eyebrow">Frequently asked</p><h2>Clear answers before the first recording.</h2></div>
          <div className="faq-list">
            {faqs.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
          </div>
        </div>
      </section>
    </main>
  );
}
