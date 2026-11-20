"use client";

import Link from "next/link";
import { useState } from "react";

function rupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100);
}

/** Quantity, total, and the Buy now link, plus a buy bar fixed to the bottom on phones. */
export function BuyPanel({ unitPricePaise, maxQuantity, soldOut }: { unitPricePaise: number; maxQuantity: number; soldOut: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const href = `/checkout?qty=${quantity}`;
  return (
    <>
      <div className="buy-panel">
        <div className="checkout-qty">
          <span>Quantity</span>
          <div className="qty-stepper">
            <button type="button" aria-label="Decrease quantity" disabled={soldOut || quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" aria-label="Increase quantity" disabled={soldOut || quantity >= maxQuantity} onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}>+</button>
          </div>
        </div>
        {soldOut ? (
          <span className="button button-violet buy-now is-disabled" aria-disabled="true">Sold out</span>
        ) : (
          <Link className="button button-violet buy-now" href={href}>Buy now · {rupees(unitPricePaise * quantity)}</Link>
        )}
      </div>
      <div className="buy-bar" aria-label="Buy Aira">
        <div><strong>{rupees(unitPricePaise)}</strong><span>Free delivery</span></div>
        {soldOut ? <span className="button button-violet is-disabled" aria-disabled="true">Sold out</span> : <Link className="button button-violet" href={href}>Buy now</Link>}
      </div>
    </>
  );
}
