import { PilotApplicationForm } from "@/components/pilot-form";
import { PageHero } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Clinical documentation pilot for doctors and clinics", "Apply for the Aira clinical documentation pilot in Chennai, Bengaluru, Hyderabad, Mumbai, or Coimbatore.", "/pilot");

export default function PilotPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Join the Pilot" path="/pilot" title="Test the workflow with us, carefully and honestly." description="We are inviting qualified doctors and clinic teams to help evaluate whether Aira fits real consultation workflows. Applications outside the first five cities join a future-access list." />
      <section className="section">
        <div className="container pilot-layout">
          <aside className="pilot-aside">
            <p className="eyebrow">Pilot at a glance</p>
            <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)" }}>A structured evaluation, not a sales demo.</h2>
            <ul>
              <li><strong>Cities:</strong> Chennai, Bengaluru, Hyderabad, Mumbai, Coimbatore</li>
              <li><strong>Participants:</strong> Qualified doctors, clinic owners, and hospital administrators</li>
              <li><strong>Focus:</strong> Workflow fit, consent clarity, review effort, and return-visit usefulness</li>
              <li><strong>Commitment:</strong> Onboarding, agreed trial activity, and regular feedback</li>
            </ul>
            <p className="notice">Applying does not guarantee selection. Pilot scope, responsibilities, and data handling will be agreed before participation.</p>
          </aside>
          <PilotApplicationForm />
        </div>
      </section>
    </main>
  );
}
