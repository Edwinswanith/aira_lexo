import Link from "next/link";
import { PageHero } from "@/components/page-sections";
import { business, formatPolicyDate, storePolicy } from "@/lib/business";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Refund and Cancellation Policy", "How cancellations, returns, refunds, and warranty claims work for Aira orders placed on airalexo.in.", "/refund-policy");

export default function RefundPolicyPage() {
  const email = <a href={`mailto:${business.supportEmail}`}>{business.supportEmail}</a>;
  return (
    <main id="main-content">
      <PageHero eyebrow="Refund and Cancellation Policy" path="/refund-policy" title="Refund and Cancellation Policy" description="How to cancel an order, return a product, claim a refund, or use the warranty for Aira orders placed on airalexo.in." />
      <section className="legal" aria-label="Refund and cancellation policy details">
        <p><strong>Effective date and last updated:</strong> <time dateTime={storePolicy.lastUpdated}>{formatPolicyDate(storePolicy.lastUpdated)}</time></p>
        <p>This policy applies to products bought directly from {business.legalName} on airalexo.in. It does not limit any right you have under Indian consumer law.</p>

        <h2>Cancelling an order</h2>
        <p>You can cancel any time before your order is dispatched by emailing {email} or calling {business.supportPhone} with your order number. We refund the full amount, including any charges, to your original payment method. After dispatch, you can still refuse the delivery or return the product under the section below.</p>

        <h2>Returns</h2>
        <p>You can return a product within {storePolicy.returnWindowDays} days of delivery if it is unused, undamaged, and in its original packaging with all accessories and documents. To start a return, email {email} with your order number. We arrange the pickup within India at no cost to you.</p>
        <p>Once we receive and inspect the product, we refund the full amount paid. If the product is used or incomplete, we will contact you before deciding on a partial refund or returning it to you.</p>

        <h2>Damaged, defective, or wrong items</h2>
        <p>If your product arrives damaged, does not work, or is not what you ordered, tell us within 48 hours of delivery at {email}, with your order number and photos of the product and packaging. We will replace it or refund you in full, as you prefer, and collect the original at no cost.</p>

        <h2>Refund timing</h2>
        <p>Approved refunds are issued to the original payment method, such as your UPI account, card, or bank account. We start the refund within 2 working days of approval. Your bank or card issuer usually credits it within {storePolicy.refundWorkingDays} working days after that.</p>

        <h2>Warranty</h2>
        <p>Aira hardware carries a {storePolicy.warrantyMonths} month warranty from the date of delivery against manufacturing defects. We repair or replace a product with a covered defect. The warranty does not cover physical damage, liquid damage, normal wear, loss, or damage from unauthorised repair or modification. To make a claim, email {email} with your order number and a description of the problem.</p>

        <h2>Software access</h2>
        <p>Where an order includes access to the Aira review app, that access ends when a return or cancellation is refunded.</p>

        <h2>Questions and complaints</h2>
        <p>Contact us at {email} or {business.supportPhone}. See our <Link href="/contact">Contact page</Link> for our grievance officer and registered address, and our <Link href="/shipping-policy">Shipping and Delivery Policy</Link> for delivery terms.</p>
      </section>
    </main>
  );
}
