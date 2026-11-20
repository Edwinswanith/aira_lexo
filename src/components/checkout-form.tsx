"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

type CheckoutProduct = {
  name: string;
  shortDescription: string;
  unitPricePaise: number;
  gstRatePercent: number;
  maxQuantity: number;
  imagePath: string;
  imageAlt: string;
  inTheBox: string[];
  notIncluded?: string;
  alsoIncluded?: string[];
};

type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", handler: (response: { error?: { description?: string } }) => void) => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;
type CreatedOrder = {
  orderNumber: string;
  accessToken: string;
  razorpay: { keyId: string; orderId: string; amount: number; currency: string };
  prefill: { name: string; email: string; contact: string };
};
type Stage = "form" | "creating" | "paying" | "verifying" | "interrupted";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function rupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100);
}

function loadRazorpay(): Promise<RazorpayConstructor> {
  const existing = (window as typeof window & { Razorpay?: RazorpayConstructor }).Razorpay;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => {
      const loaded = (window as typeof window & { Razorpay?: RazorpayConstructor }).Razorpay;
      if (loaded) resolve(loaded);
      else reject(new Error("Razorpay did not load"));
    };
    script.onerror = () => reject(new Error("Razorpay did not load"));
    document.body.appendChild(script);
  });
}

export function CheckoutForm({ product, states, paymentsReady, initialQuantity = 1 }: { product: CheckoutProduct; states: string[]; paymentsReady: boolean; initialQuantity?: number }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const created = useRef<CreatedOrder | null>(null);

  const total = product.unitPricePaise * quantity;
  const gst = Math.round((total * product.gstRatePercent) / (100 + product.gstRatePercent));
  const busy = stage === "creating" || stage === "paying" || stage === "verifying";

  function goToOrder(order: CreatedOrder) {
    router.push(`/order/${encodeURIComponent(order.orderNumber)}?t=${encodeURIComponent(order.accessToken)}`);
  }

  async function verify(order: CreatedOrder, response: RazorpaySuccess) {
    setStage("verifying");
    try {
      await fetch("/api/orders/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber, accessToken: order.accessToken, ...response }),
      });
    } catch {
      // The order page checks the status again, and the webhook confirms it independently.
    }
    goToOrder(order);
  }

  async function openPayment(order: CreatedOrder) {
    setFormError("");
    let Razorpay: RazorpayConstructor;
    try {
      Razorpay = await loadRazorpay();
    } catch {
      setStage("interrupted");
      setFormError("The payment window could not load. Check your connection and try again.");
      return;
    }
    setStage("paying");
    const instance = new Razorpay({
      key: order.razorpay.keyId,
      order_id: order.razorpay.orderId,
      amount: order.razorpay.amount,
      currency: order.razorpay.currency,
      name: "Aira",
      description: `${product.name} x ${quantity}`,
      image: `${window.location.origin}/images/aira-logo-mark-256.png`,
      prefill: order.prefill,
      notes: { order_number: order.orderNumber },
      theme: { color: "#654bff" },
      handler: (response: RazorpaySuccess) => { void verify(order, response); },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          setStage((current) => (current === "verifying" ? current : "interrupted"));
          setFormError((current) => current || "Payment was not completed. Your order is held for 30 minutes, so you can try again.");
        },
      },
    });
    instance.on("payment.failed", (response) => {
      setFormError(`Payment failed: ${response.error?.description || "the bank declined it"}. You can try again with another method.`);
    });
    instance.open();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError("");
    setStage("creating");
    const form = new FormData(event.currentTarget);
    const payload = {
      quantity,
      fullName: form.get("fullName"),
      email: form.get("email"),
      phone: form.get("phone"),
      addressLine1: form.get("addressLine1"),
      addressLine2: form.get("addressLine2"),
      city: form.get("city"),
      state: form.get("state"),
      pincode: form.get("pincode"),
      gstin: needsInvoice ? form.get("gstin") : "",
      businessName: needsInvoice ? form.get("businessName") : "",
      acceptTerms: form.get("acceptTerms") === "on",
    };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (response.status === 400) {
        setErrors(result.errors || {});
        setFormError(result.errors?.form || "Check the highlighted fields and try again.");
        setStage("form");
        return;
      }
      if (response.status === 409) {
        setFormError("Sorry, there is not enough stock for this quantity right now. Try a smaller quantity or contact us.");
        setStage("form");
        return;
      }
      if (response.status === 429) {
        setFormError("Too many attempts from this network. Please wait 15 minutes and try again.");
        setStage("form");
        return;
      }
      if (!response.ok) {
        setFormError("We could not start your payment right now. No money has been taken. Please try again shortly.");
        setStage("form");
        return;
      }
      created.current = result as CreatedOrder;
      await openPayment(created.current);
    } catch {
      setFormError("We could not reach our checkout service. No money has been taken. Please try again.");
      setStage("form");
    }
  }

  const error = (field: string) => errors[field] ? <span className="field-error" id={`${field}-error`}>{errors[field]}</span> : null;
  const a11y = (field: string) => ({ "aria-invalid": Boolean(errors[field]), "aria-describedby": errors[field] ? `${field}-error` : undefined });
  const locked = stage !== "form";

  return (
    <div className="checkout-layout">
      <form className="form-shell" onSubmit={submit} noValidate>
        <div className="section-heading" style={{ marginBottom: 28 }}>
          <p className="eyebrow">Checkout</p>
          <h1 className="checkout-title">Delivery details</h1>
          <p className="muted">We ship across India. Your details are used only for this order and delivery.</p>
        </div>
        {formError && <div className="form-status error" role="alert">{formError}</div>}
        <fieldset className="form-grid" disabled={locked}>
          <div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" autoComplete="name" required {...a11y("fullName")} />{error("fullName")}</div>
          <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required {...a11y("email")} />{error("email")}</div>
          <div className="field"><label htmlFor="phone">Mobile number</label><input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10 digit mobile" required {...a11y("phone")} />{error("phone")}</div>
          <div className="field"><label htmlFor="pincode">PIN code</label><input id="pincode" name="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" required {...a11y("pincode")} />{error("pincode")}</div>
          <div className="field full"><label htmlFor="addressLine1">House, building, and street</label><input id="addressLine1" name="addressLine1" autoComplete="address-line1" required {...a11y("addressLine1")} />{error("addressLine1")}</div>
          <div className="field full"><label htmlFor="addressLine2">Area or landmark, optional</label><input id="addressLine2" name="addressLine2" autoComplete="address-line2" {...a11y("addressLine2")} />{error("addressLine2")}</div>
          <div className="field"><label htmlFor="city">City</label><input id="city" name="city" autoComplete="address-level2" required {...a11y("city")} />{error("city")}</div>
          <div className="field"><label htmlFor="state">State</label><select id="state" name="state" defaultValue="" required {...a11y("state")}><option value="" disabled>Select a state</option>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select>{error("state")}</div>
          <div className="field full">
            <label className="checkbox-row" htmlFor="needsInvoice"><input id="needsInvoice" type="checkbox" checked={needsInvoice} onChange={(event) => setNeedsInvoice(event.target.checked)} /><span>I need a GST invoice for my clinic or business</span></label>
          </div>
          {needsInvoice && <>
            <div className="field"><label htmlFor="gstin">GSTIN</label><input id="gstin" name="gstin" maxLength={15} autoCapitalize="characters" required {...a11y("gstin")} />{error("gstin")}</div>
            <div className="field"><label htmlFor="businessName">Registered business name</label><input id="businessName" name="businessName" autoComplete="organization" required {...a11y("businessName")} />{error("businessName")}</div>
          </>}
          <div className="field full">
            <label className="checkbox-row" htmlFor="acceptTerms"><input id="acceptTerms" name="acceptTerms" type="checkbox" required {...a11y("acceptTerms")} /><span>I agree to the <Link href="/terms-of-service" target="_blank">Terms</Link>, <Link href="/refund-policy" target="_blank">Refund Policy</Link>, and <Link href="/shipping-policy" target="_blank">Shipping Policy</Link>.</span></label>
            {error("acceptTerms")}
          </div>
        </fieldset>
        <div className="checkout-actions">
          {stage === "interrupted" && created.current ? (
            <button className="button button-violet" type="button" onClick={() => created.current && void openPayment(created.current)}>Try payment again</button>
          ) : (
            <button className="button button-violet" type="submit" disabled={busy || !paymentsReady}>
              {stage === "creating" ? "Starting secure payment" : stage === "paying" ? "Complete payment in the window" : stage === "verifying" ? "Confirming payment" : `Pay ${rupees(total)}`}
            </button>
          )}
          {!paymentsReady && <p className="field-error">Payments are not configured for this deployment.</p>}
          <p className="muted checkout-secure">Secure payment by Razorpay: UPI, cards, net banking, and wallets. Card details never reach our servers.</p>
        </div>
      </form>

      <aside className="checkout-summary" aria-label="Order summary">
        <div className="checkout-product">
          <div className="checkout-image">
            <Image src={product.imagePath} alt={product.imageAlt} fill sizes="(max-width: 980px) 100vw, 420px" />
            <span className="concept-label">Real product photo. Background added.</span>
          </div>
          <div>
            <h2 className="checkout-product-name">{product.name}</h2>
            <p className="muted">{product.shortDescription}</p>
          </div>
        </div>
        <div className="checkout-qty">
          <span>Quantity</span>
          <div className="qty-stepper">
            <button type="button" aria-label="Decrease quantity" disabled={locked || quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" aria-label="Increase quantity" disabled={locked || quantity >= product.maxQuantity} onClick={() => setQuantity((value) => Math.min(product.maxQuantity, value + 1))}>+</button>
          </div>
        </div>
        <dl className="checkout-totals">
          <div><dt>{rupees(product.unitPricePaise)} x {quantity}</dt><dd>{rupees(total)}</dd></div>
          <div><dt>Delivery</dt><dd>Free</dd></div>
          <div className="muted"><dt>Includes GST ({product.gstRatePercent}%)</dt><dd>{rupees(gst)}</dd></div>
          <div className="checkout-total"><dt>Total payable</dt><dd>{rupees(total)}</dd></div>
        </dl>
        <div className="checkout-box">
          <p className="eyebrow">In the box</p>
          <ul>{[...product.inTheBox, ...(product.alsoIncluded || [])].map((item) => <li key={item}>{item}</li>)}</ul>
          {product.notIncluded && <p className="muted checkout-not-included">{product.notIncluded}</p>}
        </div>
        <p className="muted checkout-policy">Dispatched in 2 to 3 working days. 7 day returns. 6 month warranty. Full refund if cancelled before dispatch.</p>
      </aside>
    </div>
  );
}
