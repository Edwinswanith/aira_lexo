import Link from "next/link";
import { PageHero } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

const path = "/mediscript/privacy-policy";
const title = "MediScript CRM Privacy Policy";
const description = "How AiraLexo handles information in MediScript CRM and its WhatsApp Business integration.";

export const metadata = pageMetadata(title, description, path);

export default function MediScriptPrivacyPolicyPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="MediScript CRM" path={path} title={title} description={description} />
      <section className="legal" aria-label="MediScript privacy policy details">
        <p><strong>Effective date</strong> <time dateTime="2026-11-24">24 November 2026</time></p>

        <h2>Who we are and what this policy covers</h2>
        <p>AIRALEXO SOLUTIONS PRIVATE LIMITED (AiraLexo) provides MediScript CRM, a platform for managing patient visits, clinical documentation, and clinic communications. This policy covers MediScript CRM and the WhatsApp Business integration for the AiraLexo MediScript Meta app. It applies to information about clinic administrators, doctors, receptionists, patients, and other people a clinic authorizes to receive messages.</p>

        <h2>Information MediScript processes</h2>
        <p>The information we process depends on the features a clinic uses and what its staff and patients provide.</p>
        <ul>
          <li><strong>Clinic and staff accounts.</strong> Clinic names and profiles, staff names and contact details, roles and permissions, sign-in and session records, and security and audit events.</li>
          <li><strong>Patient, appointment, and billing information.</strong> Patient names, phone numbers, age and gender, clinic record identifiers, appointment and visit details, and invoice details entered by the clinic.</li>
          <li><strong>Healthcare information.</strong> Conditions, allergies, medications, uploaded documents, and, when clinical documentation features are used, consultation recordings, transcripts, draft notes, and doctor-reviewed records.</li>
          <li><strong>WhatsApp account information.</strong> Meta business and WhatsApp Business Account identifiers, business phone numbers and phone-number identifiers, connection status, and authorization credentials and expiry information.</li>
          <li><strong>WhatsApp communications.</strong> Recipient phone numbers and WhatsApp identifiers, supported incoming messages and replies, outgoing message text or template details, timestamps, delivery or read status where available, and consent and opt-out records. A conversation can be associated with a clinic patient record.</li>
        </ul>

        <h2>How we use information and what clinics manage</h2>
        <p>We process information to operate clinic workspaces, support appointment and billing workflows, assist with clinical documentation and doctor review, troubleshoot issues, and maintain security and audit records. Where WhatsApp features are enabled, MediScript uses the relevant information to connect authorized business accounts, support permitted messages, and apply communication preferences.</p>
        <p>Clinics manage their patient records, choose which staff can access them, give patients applicable notices, and obtain permissions for care and communications where required. AiraLexo operates the software and processes clinic-managed information to provide the features clinics use. Doctors review clinical documentation and make care decisions.</p>
        <p>If a clinic uses MediScript for a child’s care, the clinic may enter the child’s information into its clinical records. A parent or guardian can contact the clinic about those records or permissions for communications.</p>

        <h2>WhatsApp Business accounts and messages</h2>
        <p>When the integration is enabled, an authorized clinic administrator can use Meta Embedded Signup to connect the clinic’s own WhatsApp Business Account. MediScript uses the account information and authorization to manage the connection. It processes supported incoming messages and status updates and uses recipient and message information to send permitted messages through the WhatsApp Business Platform.</p>
        <p>Clinics select recipients and record the appropriate opt-in. The sending workflow checks for recorded service consent and opt-out status and requires separate marketing consent for marketing templates. Sending depends on staff permissions, enabled features, and template approval. Free-text replies require an open customer service window.</p>
        <p>To stop WhatsApp messages, contact the clinic. When a connected clinic number receives replies through MediScript, a <strong>STOP</strong> reply updates the messaging preference for that clinic. Use the clinic’s designated channel for medical records or treatment information.</p>
        <p>When the integration is used, Meta and WhatsApp receive the business account, recipient, and message information needed to operate it. Recipients may keep copies of messages delivered to them. See the <a href="https://www.whatsapp.com/legal/">WhatsApp legal and privacy information</a> for the terms that apply to WhatsApp’s services.</p>

        <h2>Service providers, storage, and security</h2>
        <p>MediScript supports MongoDB for application records, Cloudflare R2 for files such as recordings and uploaded documents, Deepgram for transcription, and Google Gemini for AI-assisted clinical documentation. These integrations handle information when configured and used for the relevant feature. Transcript text is handled as a clinical application record.</p>
        <p>MediScript uses authenticated sessions, role-based permissions, and clinic-scoped access checks for patient and WhatsApp records. The WhatsApp integration encrypts stored authorization tokens and verifies signatures on incoming Meta webhooks.</p>

        <h2>Retention and clinical record deletion</h2>
        <p>MediScript supports configurable cleanup for certain WhatsApp records. Opt-out records help preserve messaging preferences, and audit records help track security and account activity. Contact your clinic about retention or deletion of a clinical record. The clinic can review the request and contact AiraLexo for help with information held in MediScript.</p>

        <h2>Disconnecting a WhatsApp Business Account</h2>
        <p>When the integration is enabled, an authorized clinic administrator can disconnect the clinic’s WhatsApp Business Account. The disconnect workflow removes the stored authorization credential and attempts to revoke access through Meta. The clinic can review its permissions in Meta’s business settings. To request deletion of stored messages, clinical records, or other information, use the privacy request process below.</p>

        <h2>Access, correction, and privacy requests</h2>
        <p>For access to, correction of, or deletion of clinic-managed information, or to withdraw a permission, contact the clinic first. The clinic can assess your request and ask AiraLexo for assistance where appropriate.</p>
        <p>For MediScript account or integration privacy requests, email <a href="mailto:edwin@airalexo.in">edwin@airalexo.in</a>. Include the clinic name, your relationship to the clinic or account, and what you are requesting. We may ask you to verify your identity or authority. Keep medical records, passwords, and access tokens out of your initial email. See the <Link href="/data-deletion">data deletion instructions</Link> for request steps. Information held independently by a clinic, Meta, or a message recipient may require a request to that party.</p>

        <h2>Changes to this policy</h2>
        <p>AiraLexo will post updates at this address and update the effective date when a revised policy takes effect.</p>
      </section>
    </main>
  );
}
