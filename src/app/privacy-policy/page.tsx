import Link from "next/link";
import { PageHero } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Privacy Policy | AiraLexo CRM", "Privacy information for AiraLexo services, MediScript, WhatsApp Business integrations, website visits, and deletion requests.", "/privacy-policy");

export default function PrivacyPolicyPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Privacy Policy" path="/privacy-policy" title="Privacy Policy" description="How AiraLexo handles information across our website, connected services, and authorized WhatsApp Business integrations." />
      <section className="legal" aria-label="Privacy policy details">
        <p><strong>Effective date:</strong> <time dateTime="2026-11-06">6 November 2026</time><br /><strong>Last updated:</strong> <time dateTime="2026-11-06">6 November 2026</time></p>

        <h2>1. Who we are and what this policy covers</h2>
        <p>AiraLexo Solutions Private Limited provides software, hardware, and AI-enabled services. This policy covers airalexo.in, website pilot applications, and information processed through our connected services, including MediScript and the AiraLexo CRM Meta application (App ID 1777002823517781). MediScript supports doctors, clinics, and hospitals with clinical workflows and authorized WhatsApp Business communication. The information processed depends on the features a clinic enables and uses.</p>
        <p>For privacy questions and requests, contact <a href="mailto:edwin@airalexo.in">edwin@airalexo.in</a>. Patients should also contact their treating clinic about records that the clinic manages.</p>

        <h2>2. Information we collect and process</h2>
        <ul>
          <li><strong>Accounts and clinics:</strong> authorized user names, email addresses, contact details, roles, clinic or business profiles, and login and authorization information.</li>
          <li><strong>WhatsApp connections:</strong> Meta business identifiers, WhatsApp Business Account identifiers, business phone-number identifiers and display numbers, verified business names, authorization tokens, connection state, and token-expiry information.</li>
          <li><strong>Communications:</strong> customer or patient phone numbers and WhatsApp contact identifiers; supported incoming message text, button or interactive replies; outgoing text and template messages; message identifiers, direction, timestamps, delivery/read/failure status, conversation state, and associations with clinic patient records where matched.</li>
          <li><strong>Consent and security:</strong> communication preferences, consent sources and timestamps, opt-out records, authorization events, audit records, and operational or security logs.</li>
          <li><strong>Clinical services:</strong> patient details entered by a clinic and, when the relevant service is used, consultation audio, transcripts, draft and doctor-reviewed notes, reports, and related clinical workflow records. These are separate from the WhatsApp messaging feature.</li>
          <li><strong>Website applications:</strong> name, email, optional phone number, professional role, specialty, organization, city, approximate patient volume, documentation practices, pilot interest, consent, and referral or campaign information.</li>
        </ul>
        <p>Do not include patient information or consultation recordings in website pilot applications or privacy-request emails. WhatsApp access is limited to supported events and account permissions; it does not provide unrestricted access to a person&apos;s private WhatsApp conversations or complete historical WhatsApp Business App synchronization.</p>

        <h2>3. How we use information</h2>
        <p>We use information to connect and maintain authorized business accounts, support clinic communication, process incoming messages, send permitted notifications and approved templates, maintain communication preferences, and respond to customer requests. We also use it to provide enabled clinical documentation services, support doctor review, administer accounts, troubleshoot problems, protect account security, and maintain operational and audit records. Website application information helps us assess pilot fit and contact applicants.</p>
        <p>WhatsApp sending is subject to recorded consent, authorized staff actions, enabled features, and applicable Meta messaging restrictions. Approval of an integration does not permit unlimited or unsolicited messaging.</p>

        <h2>4. WhatsApp and Meta integration</h2>
        <p>Authorized business owners or clinic administrators connect accounts through Meta Embedded Signup using the official WhatsApp Business Platform. Clinics retain control of their WhatsApp Business assets, subject to Meta&apos;s platform rules. AiraLexo processes the account and communication information authorized for the service.</p>
        <p>Connection management requires an authenticated clinic administrator. Supported WhatsApp account, message, conversation, and consent operations are scoped to the authenticated clinic. Receptionist messaging access, where enabled, depends on explicit permissions.</p>
        <p>Clinic administrators can use the WhatsApp connection controls in MediScript Settings to disconnect an account. Disconnection removes the locally stored authorization credential and attempts to revoke Meta permissions; remote revocation may require further action in Meta&apos;s business settings. Disconnection does not automatically erase existing messages, clinical records, or audit records. See our <Link href="/data-deletion">data deletion instructions</Link>.</p>
        <p>WhatsApp communications are also subject to <a href="https://www.whatsapp.com/legal/business-terms/">WhatsApp Business Terms</a>, the <a href="https://www.whatsapp.com/legal/privacy-policy/">WhatsApp Privacy Policy</a>, and applicable <a href="https://www.facebook.com/privacy/policy/">Meta privacy terms</a>.</p>

        <h2>5. Healthcare information and clinic responsibilities</h2>
        <p>Clinics determine the purposes of their patient records and are responsible for appropriate patient notices, permissions, authorized staff access, and clinical record obligations. AiraLexo provides the technology used to process that information for the enabled services. Doctors remain responsible for reviewing clinical outputs and making care decisions.</p>
        <p>The WhatsApp feature is intended for permitted clinic communications, not for transmitting consultation recordings, transcripts, diagnoses, prescriptions, or treatment records. Messaging safeguards cannot guarantee that a person will never include sensitive information in free text. Patients should use the communication channel recommended by their clinic.</p>

        <h2>6. Storage, service providers, and security</h2>
        <p>Our website is hosted on Vercel. The website application flow uses Supabase for database storage and Resend for application emails when configured. Plausible provides cookieless website analytics; our analytics events do not include applicant names, email addresses, phone numbers, free text, or application identifiers.</p>
        <p>Connected services use Meta and WhatsApp for business authorization and message delivery. Depending on the enabled deployment and feature, MediScript uses MongoDB for service records, Cloudflare R2 for recording storage, and Google&apos;s Gemini services for transcription or AI-assisted documentation. Clinical processing providers are separate from Meta&apos;s WhatsApp messaging services.</p>
        <p>Implemented controls include authenticated and role-restricted access, clinic-scoped WhatsApp data operations, encrypted stored WhatsApp authorization tokens, and signature verification for incoming Meta webhooks. Website database credentials are used server-side. These controls reduce risk but cannot guarantee absolute security. We do not claim that information stored or processed within AiraLexo&apos;s systems is all end-to-end encrypted.</p>

        <h2>7. Retention and deletion</h2>
        <p>The website&apos;s scheduled cleanup is configured to delete pilot application database rows older than 365 days. This cleanup concerns those rows, not every email, log, or record held by another service provider.</p>
        <p>MediScript and WhatsApp retention depends on the record type, deployment settings, clinic instructions, and applicable recordkeeping needs. Message and non-opt-out consent cleanup is configurable and is disabled by default; it is not a promise of automatic deletion after a fixed period. Opt-out records are retained to respect communication preferences, and audit records are retained without an automatic expiry in the current implementation. Disconnecting an account is separate from requesting deletion.</p>
        <p>Clinical records and recordings follow the clinic&apos;s applicable retention arrangements. We do not promise a universal clinical-record retention period. Requests are reviewed for information we can delete and for any legal, security, audit, or clinical record obligations requiring retention. Information independently held by a clinic, Meta, a recipient, or another provider may require a separate request to that organization.</p>

        <h2>8. Your choices and privacy requests</h2>
        <p>You or an authorized clinic representative may request access, correction, deletion, withdrawal of applicable consent, or help disconnecting an integration by emailing <a href="mailto:edwin@airalexo.in">edwin@airalexo.in</a>. Include the service, clinic or account, contact information used with it, and the request. We may need to verify identity or authority before acting. Avoid sending medical records, passwords, or access tokens.</p>
        <p>For clinic-managed patient information, contact the clinic first so it can assess the request and instruct us where appropriate. A supported WhatsApp opt-out message such as STOP withdraws messaging consent for that clinic; it does not delete the clinical record. Withdrawal and deletion may limit the services available and remain subject to applicable legal or operational limitations.</p>

        <h2>9. International processing</h2>
        <p>Information may be processed outside your country, including outside India, because hosting, communication, storage, and AI providers operate across jurisdictions. Processing locations depend on the service and its configured providers; we do not represent that all information stays in India. Contact us for information about the processing arrangements relevant to your clinic or service.</p>

        <h2>10. Contact and data deletion</h2>
        <p>Privacy contact: AiraLexo Solutions Private Limited, <a href="mailto:edwin@airalexo.in">edwin@airalexo.in</a>. Read the <Link href="/data-deletion">Data Deletion</Link> page for request steps and limitations, and our <Link href="/terms-of-service">Terms of Service</Link> for website use.</p>

        <h2>11. Policy updates</h2>
        <p>We will post updates at this permanent URL and revise the effective and last-updated dates. Material changes will be highlighted on this page and, where applicable, communicated through the affected service or available account contact details. The stated effective date identifies when the updated policy applies.</p>
      </section>
    </main>
  );
}
