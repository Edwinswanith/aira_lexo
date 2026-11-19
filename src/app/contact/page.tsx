import Link from "next/link";
import { PageHero } from "@/components/page-sections";
import { business, formatPolicyDate, phoneDigits, storePolicy } from "@/lib/business";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Contact", "Contact AiraLexo Solutions Private Limited for orders, support, refunds, and questions about Aira.", "/contact");

export default function ContactPage() {
  const digits = phoneDigits(business.supportPhone);
  return (
    <main id="main-content">
      <PageHero eyebrow="Contact" path="/contact" title="Contact Aira" description="Questions about Aira, an order, a refund, or the clinical pilot reach a person on our team." />
      <section className="legal" aria-label="Contact details">
        <p><strong>Last updated:</strong> <time dateTime={storePolicy.lastUpdated}>{formatPolicyDate(storePolicy.lastUpdated)}</time></p>

        <h2>Email</h2>
        <p><a href={`mailto:${business.supportEmail}`}>{business.supportEmail}</a>. We reply within one working day. Please do not send patient names, medical information, or consultation recordings by email.</p>

        <h2>Phone and WhatsApp</h2>
        <p><a href={`tel:+${digits}`}>{business.supportPhone}</a> (call or <a href={`https://wa.me/${digits}`} rel="noopener noreferrer" target="_blank">WhatsApp</a>), {business.supportHours}.</p>

        <h2>Registered office</h2>
        <address>
          {business.legalName}
          {business.registeredAddress.map((line) => <span key={line}><br />{line}</span>)}
        </address>

        <h2>Grievance officer</h2>
        <p>{business.grievanceOfficer.name}, {business.grievanceOfficer.designation}, {business.legalName}. Email <a href={`mailto:${business.supportEmail}`}>{business.supportEmail}</a> or call {business.supportPhone}. We acknowledge every complaint within 48 hours and aim to resolve it within one month of receipt.</p>

        <h2>Orders, refunds, and delivery</h2>
        <p>Read our <Link href="/refund-policy">Refund and Cancellation Policy</Link> and <Link href="/shipping-policy">Shipping and Delivery Policy</Link>. For an existing order, include your order number when you contact us.</p>

        <h2>Privacy requests</h2>
        <p>See our <Link href="/privacy-policy">Privacy Policy</Link> and <Link href="/data-deletion">data deletion instructions</Link>.</p>
      </section>
    </main>
  );
}
