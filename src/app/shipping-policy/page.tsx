import Link from "next/link";
import { PageHero } from "@/components/page-sections";
import { business, formatPolicyDate, storePolicy } from "@/lib/business";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Shipping and Delivery Policy", "Where we ship Aira orders, delivery charges, dispatch and delivery times, and tracking.", "/shipping-policy");

export default function ShippingPolicyPage() {
  const email = <a href={`mailto:${business.supportEmail}`}>{business.supportEmail}</a>;
  return (
    <main id="main-content">
      <PageHero eyebrow="Shipping and Delivery Policy" path="/shipping-policy" title="Shipping and Delivery Policy" description="Where we ship, what delivery costs, and how long Aira orders placed on airalexo.in take to arrive." />
      <section className="legal" aria-label="Shipping and delivery policy details">
        <p><strong>Effective date and last updated:</strong> <time dateTime={storePolicy.lastUpdated}>{formatPolicyDate(storePolicy.lastUpdated)}</time></p>

        <h2>Where we ship</h2>
        <p>We ship to {storePolicy.shipsTo}. We do not ship outside India at present.</p>

        <h2>Delivery charges</h2>
        <p>Delivery is {storePolicy.shippingCharge.toLowerCase()} on every order. The price shown at checkout is the total you pay, including GST.</p>

        <h2>Dispatch and delivery times</h2>
        <p>We dispatch orders within {storePolicy.dispatchWorkingDays} working days of payment confirmation. Delivery usually takes {storePolicy.deliveryWorkingDays} working days after dispatch, depending on your location. Remote areas, public holidays, and events outside our control can add time. If we cannot dispatch within the stated time, we will tell you and offer a full refund.</p>

        <h2>Tracking</h2>
        <p>When your order is dispatched, we email you the courier name and tracking number.</p>

        <h2>Address and delivery attempts</h2>
        <p>Please check your delivery address and phone number at checkout. The courier may call you to arrange delivery. If delivery fails after the courier&apos;s attempts and the parcel returns to us, we will contact you to arrange delivery again or refund your order.</p>

        <h2>Damaged parcels</h2>
        <p>If the parcel looks damaged when it arrives, you may refuse it. If you accept it and find damage inside, email {email} within 48 hours with photos, and we will replace the product or refund you under our <Link href="/refund-policy">Refund and Cancellation Policy</Link>.</p>

        <h2>Questions</h2>
        <p>Contact us at {email} or {business.supportPhone}, {business.supportHours}. See our <Link href="/contact">Contact page</Link> for full details.</p>
      </section>
    </main>
  );
}
