import Link from "next/link";
import { PageHero } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Terms of Service", "Terms for the AiraLexo website, pilot applications, and authorized access to connected service information.", "/terms-of-service");

export default function TermsOfServicePage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Terms of Service" path="/terms-of-service" title="Terms of Service" description="Terms for using the AiraLexo public website and submitting a pilot application. Product agreements and clinic arrangements govern connected clinical services." />
      <section className="legal" aria-label="Terms of service details">
        <p><strong>Effective date and last updated:</strong> <time dateTime="2026-11-06">6 November 2026</time></p>
        <h2>About this website</h2>
        <p>AiraLexo Solutions Private Limited operates this website. It describes our services and prototype-stage Aira hardware and accepts expressions of interest in pilots. A website application does not promise selection, availability, or a commercial relationship. Product images marked as concept renders do not represent a final product.</p>
        <h2>Acceptable use</h2>
        <p>Use the website lawfully. Do not attempt unauthorized access, interfere with its operation, submit misleading information, or include patient information in website application forms. Connect a clinic&apos;s business account only when authorized to do so.</p>
        <h2>Clinical services and third-party platforms</h2>
        <p>Website information is not medical advice. Doctors remain responsible for clinical review and care decisions. Use of MediScript and other connected services is subject to the applicable service agreement, clinic permissions, and patient information arrangements. WhatsApp integrations are also subject to Meta and WhatsApp terms, messaging restrictions, and account eligibility. We do not promise unrestricted messaging or complete historical synchronization.</p>
        <h2>Content and availability</h2>
        <p>Website content and branding belong to AiraLexo Solutions Private Limited or their respective rights holders. External links remain under their publishers&apos; control. We work to keep the site accurate and available but cannot guarantee uninterrupted operation or complete information. Any applicable liability limits remain subject to law and the relevant service agreement.</p>
        <h2>Privacy and requests</h2>
        <p>Read our <Link href="/privacy-policy">Privacy Policy</Link> and <Link href="/data-deletion">data deletion instructions</Link>. Contact <a href="mailto:edwin@airalexo.in">edwin@airalexo.in</a> with questions about these terms.</p>
        <h2>Updates</h2>
        <p>Updates will be posted here with revised dates. Material changes affecting an existing service will be communicated where applicable through that service or available account contact details.</p>
      </section>
    </main>
  );
}
