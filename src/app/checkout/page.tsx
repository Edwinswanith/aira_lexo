import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { isRazorpayConfigured, isRazorpayTestMode } from "@/lib/razorpay";
import { indianStates, isStoreEnabled, product } from "@/lib/store";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageMetadata("Checkout", "Buy the Aira consultation recorder.", "/checkout"),
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ qty?: string }> }) {
  if (!isStoreEnabled()) notFound();
  const requested = Number.parseInt((await searchParams).qty || "1", 10);
  const initialQuantity = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), product.maxQuantityPerOrder) : 1;
  return (
    <main id="main-content">
      <section className="section checkout-section">
        <div className="container">
          {isRazorpayTestMode() && (
            <p className="checkout-test-banner" role="note">TEST MODE. No real money is charged. Box contents are placeholders.</p>
          )}
          <CheckoutForm
            product={{
              name: product.name,
              shortDescription: product.shortDescription,
              unitPricePaise: product.unitPricePaise,
              gstRatePercent: product.gstRatePercent,
              maxQuantity: product.maxQuantityPerOrder,
              imagePath: product.imagePath,
              imageAlt: product.imageAlt,
              inTheBox: [...product.inTheBox],
            }}
            states={[...indianStates]}
            paymentsReady={isRazorpayConfigured()}
            initialQuantity={initialQuantity}
          />
        </div>
      </section>
    </main>
  );
}
