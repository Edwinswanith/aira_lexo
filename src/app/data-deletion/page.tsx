import Link from "next/link";
import { PageHero } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Data Deletion | AiraLexo CRM", "How to request deletion of AiraLexo, MediScript, and WhatsApp integration information, and disconnect an authorized account.", "/data-deletion");

export default function DataDeletionPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Data Deletion" path="/data-deletion" title="Request data deletion" description="A manual request process for AiraLexo services, MediScript, website applications, and connected WhatsApp Business accounts." />
      <section className="legal" aria-label="Data deletion instructions">
        <p><strong>Effective date and last updated:</strong> <time dateTime="2026-11-06">6 November 2026</time></p>
        <h2>1. Send your request</h2>
        <p>Email <a href="mailto:edwin@airalexo.in?subject=Data%20deletion%20request">edwin@airalexo.in</a> with the subject <strong>Data deletion request</strong>. AiraLexo Solutions Private Limited handles these requests.</p>
        <ul>
          <li>Identify the service: AiraLexo CRM, MediScript, WhatsApp integration, or website pilot application.</li>
          <li>Provide your account email or associated business phone number, the clinic or business name, and your relationship to the account.</li>
          <li>Describe what information you want deleted and how we can contact you.</li>
        </ul>
        <p>Do not send patient records, identity documents, passwords, or Meta access tokens in your initial email. If you are a patient, contact the treating clinic about its clinical records; we may need its instructions before acting.</p>
        <h2>2. Verification and review</h2>
        <p>We review requests manually, may ask for proportionate verification of identity or authority, and assess the information held by AiraLexo and any applicable retention obligations. We will explain the outcome and any information that must remain. This page does not provide an automatic deletion API or promise immediate deletion or a fixed completion deadline.</p>
        <h2>3. Disconnect WhatsApp separately</h2>
        <p>An authorized clinic administrator can open MediScript Settings, find the WhatsApp Business connection, and select Disconnect. This removes the locally stored authorization credential and attempts Meta permission revocation. If remote revocation is not confirmed, review the integration in Meta&apos;s business settings or contact us for help.</p>
        <p>Disconnection stops use of that connection; it does not erase stored messages, patient records, or audit history. Include a separate deletion request if you want those records reviewed. Sending STOP withdraws supported clinic messaging consent and is not a data deletion request.</p>
        <h2>4. What may remain</h2>
        <p>Clinical record duties, legal obligations, security investigations, audit integrity, and opt-out preferences may require retaining some information. Records controlled by your clinic, copies held by recipients, and information retained independently by Meta or other providers are not automatically removed by an AiraLexo request. We cannot promise immediate removal from provider backups or logs.</p>
        <p>See the <Link href="/privacy-policy">Privacy Policy</Link> for data categories, uses, providers, and retention information.</p>
      </section>
    </main>
  );
}
