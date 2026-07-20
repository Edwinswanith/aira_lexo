import { PageHero } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Website and pilot application privacy", "How Aira Lexo Solutions Private Limited handles website visits, analytics, clinical pilot applications, retention, and deletion requests.", "/privacy");

export default function PrivacyPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Privacy" path="/privacy" title="Website and pilot application privacy." description="This notice covers this public website and the pilot application form. Product-specific clinical data handling requires a separate notice and legal review before a live deployment." />
      <section className="legal">
        <p><strong>Version:</strong> 20 July 2026</p>
        <h2>Who is responsible</h2>
        <p>Aira Lexo Solutions Private Limited operates this website and handles pilot applications submitted through it. Questions and deletion requests can be sent to <a href="mailto:privacy@airalexo.in">privacy@airalexo.in</a>.</p>
        <h2>What we collect</h2>
        <p>The application form collects your name, email, optional phone number, professional role, specialty, organization, city, approximate patient volume, documentation method, repeat-visit share, pilot interest, consent, and source information. Do not submit patient names, medical information, or consultation recordings.</p>
        <h2>Why we use it</h2>
        <p>We use application information to assess pilot fit, contact applicants, plan future access, protect the form from misuse, and understand where qualified interest comes from.</p>
        <h2>Storage and access</h2>
        <p>Applications are stored in a private managed database. The public website cannot read the application table directly. Access is restricted to authorized people working on pilot selection and support.</p>
        <h2>Retention</h2>
        <p>We keep pilot applications for up to 12 months, then delete or anonymize them unless a longer period is required for an active relationship or a legal obligation. Hashed network identifiers used for rate limiting are deleted after 24 hours.</p>
        <h2>Emails</h2>
        <p>We use Resend to deliver application notifications and confirmations. Confirmation emails remind applicants not to send patient information by email.</p>
        <h2>Analytics</h2>
        <p>We use Plausible in cookieless mode to understand page use and broad conversion events. We do not send names, email addresses, phone numbers, free text, or application identifiers to analytics. Campaign parameters are saved only when an application is submitted.</p>
        <h2>Your choices</h2>
        <p>You can ask about the information we hold, request a correction, withdraw from pilot contact, or request deletion. Applicable law may affect how a request is handled.</p>
        <h2>Changes</h2>
        <p>We may update this notice as the website or pilot changes. The current version and date will remain visible on this page.</p>
      </section>
    </main>
  );
}
