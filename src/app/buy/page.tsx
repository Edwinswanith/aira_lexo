import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, ShieldCheck, Truck, ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import gallery from "@/content/product-gallery.json";
import { BuyPanel } from "@/components/buy-panel";
import { SpinViewer, type SpinHotspot, type SpinManifest } from "@/components/spin-viewer";
import { storePolicy } from "@/lib/business";
import { getDatabase } from "@/lib/mongodb";
import { availableStock } from "@/lib/orders";
import { formatRupees, isStoreEnabled, product } from "@/lib/store";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageMetadata("Buy Aira", "Buy the Aira consultation recorder: one-button capture with consent, visible status, and doctor-controlled review.", "/buy"),
  robots: { index: false, follow: false },
};

const manifest = gallery as SpinManifest;

const hotspots: SpinHotspot[] = [
  { id: "button", title: "One-button control", text: "One press starts capture and one press ends it, so the moment recording begins is never in doubt. The button glows amber when Aira is ready to go." },
  { id: "usb", title: "USB-C charging", text: "Charges over a standard USB-C cable, included in the box." },
  { id: "pinhole", title: "Charging indicator", text: "A small indicator on the top shows the charging status." },
  { id: "slot", title: "Badge-holder slot", text: "Thread a badge holder or lanyard through the slot at the end so the recorder stays with you between consultations." },
];

const features: Array<[string, string]> = [
  ["Ready at a glance", "The button glows amber when Aira is ready, so you know it can start a consultation before the patient sits down."],
  ["Wear it or set it down", "Clip it to a badge holder or lanyard through the end slot, or leave it on the desk. It is compact and flat."],
  ["Consent first", "Recording starts only after the patient receives a clear explanation and agrees. A patient can decline without losing access to care."],
  ["You approve the record", "A structured draft goes to the Aira review app. Nothing becomes part of the record until you review and approve it."],
];

const specs: Array<[string, string]> = [
  ["Controls", "One button, glows amber when ready"],
  ["Charging", "USB-C, with a charging indicator"],
  ["Carry", "Badge-holder slot at one end"],
  ["Case", "Matte black, textured top, 3D-printed"],
  ["Works with", "Aira review app (access included)"],
  ["Ships to", "Addresses within India"],
];

const faqs: Array<[string, string]> = [
  ["Does Aira diagnose or prescribe?", "No. Aira captures the consultation with consent and prepares a structured draft. Diagnosis, prescribing, and treatment decisions stay with you."],
  ["Does the patient have to agree?", "Yes. Recording starts only after the patient receives a clear explanation and agrees. A patient can decline without losing access to the consultation."],
  ["Can I get a GST invoice?", "Yes. Tick \"I need a GST invoice\" at checkout and enter your GSTIN and registered business name."],
  ["What if it arrives damaged or I change my mind?", `Tell us within 48 hours if it arrives damaged and we replace it or refund you. You can return an unused product within ${storePolicy.returnWindowDays} days of delivery.`],
  ["How long does delivery take?", `We dispatch within ${storePolicy.dispatchWorkingDays} working days and delivery usually takes ${storePolicy.deliveryWorkingDays} working days after that. Delivery is free.`],
];

export default async function BuyPage() {
  if (!isStoreEnabled()) notFound();
  const db = await getDatabase().catch(() => null);
  const stock = db ? await availableStock(db).catch(() => null) : null;
  const soldOut = stock === 0;

  return (
    <main id="main-content" className="buy-main">
      <section className="section-tight buy-hero">
        <div className="container buy-hero-grid">
          <SpinViewer manifest={manifest} hotspots={hotspots} label={`${product.name}, shown in 360 degrees`} />

          <div className="buy-summary">
            <p className="eyebrow">Buy Aira</p>
            <h1 className="buy-title">{product.name}</h1>
            <p className="lead">{product.shortDescription}</p>
            <div className="buy-price">
              <strong>{formatRupees(product.unitPricePaise)}</strong>
              <span>Inclusive of GST. Free delivery across India.</span>
            </div>
            <p className={`buy-stock${soldOut ? " is-out" : ""}`}>
              {soldOut ? "Sold out. Contact us to be told when it is back." : stock !== null && stock <= 5 ? `In stock: only ${stock} left` : "In stock. Ships in 2 to 3 working days."}
            </p>
            <BuyPanel unitPricePaise={product.unitPricePaise} maxQuantity={product.maxQuantityPerOrder} soldOut={soldOut} />
            <ul className="buy-assurances">
              <li><ShieldCheck size={20} aria-hidden="true" />Secure payment by Razorpay: UPI, cards, net banking</li>
              <li><Truck size={20} aria-hidden="true" />Free delivery, dispatched in {storePolicy.dispatchWorkingDays} working days</li>
              <li><ArrowCounterClockwise size={20} aria-hidden="true" />{storePolicy.returnWindowDays} day returns. {storePolicy.warrantyMonths} month warranty</li>
              <li><CheckCircle size={20} aria-hidden="true" />GST invoice available for clinics</li>
            </ul>
            <p className="muted buy-placeholder-note">Price and box contents shown here are placeholders until launch.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <p className="eyebrow">What it does</p>
            <h2>Quiet in the room. Clear when it matters.</h2>
            <p className="lead">Aira supports capture, structured drafting, and your review. It does not diagnose, prescribe, or replace clinical judgment.</p>
          </div>
          <div className="buy-feature-grid">
            {features.map(([title, text]) => (
              <article className="card" key={title}><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container buy-two-col">
          <div className="form-shell">
            <p className="eyebrow">In the box</p>
            <ul className="buy-list">{product.inTheBox.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="form-shell">
            <p className="eyebrow">Specifications</p>
            <dl className="checkout-totals">
              {specs.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
            </dl>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading" style={{ marginInline: "auto", textAlign: "center" }}>
            <p className="eyebrow">Before you buy</p>
            <h2>Clear answers, before the first recording.</h2>
          </div>
          <div className="faq-list">
            {faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
          </div>
          <p className="muted buy-policies">Read our <Link href="/refund-policy">Refund and Cancellation Policy</Link>, <Link href="/shipping-policy">Shipping Policy</Link>, and <Link href="/terms-of-service">Terms</Link>. Questions? <Link href="/contact">Contact us</Link>.</p>
        </div>
      </section>
    </main>
  );
}
