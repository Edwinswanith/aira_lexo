"use client";

import Link from "next/link";
import Image from "next/image";
import { List, X } from "@phosphor-icons/react";
import { useState } from "react";

const nav = [
  ["Product", "/product"],
  ["For Doctors", "/for-doctors"],
  ["For Clinics", "/for-clinics"],
  ["Trust", "/trust"],
  ["Insights", "/insights"],
  ["Founders", "/founders"],
];

/** `showBuy` is decided on the server, so Buy only appears while the store is switched on. */
export function Header({ showBuy = false }: { showBuy?: boolean }) {
  const [open, setOpen] = useState(false);
  const links = showBuy ? [...nav, ["Buy", "/buy"]] : nav;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="Aira home" prefetch={false}>
          <span className="brand-logo-shell" aria-hidden="true">
            <Image className="brand-logo" src="/images/aira-logo-mark-256.png" alt="" width={32} height={32} priority />
          </span>
          <span>Aira</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link href={href} key={href} prefetch={false} className={href === "/buy" ? "nav-buy" : undefined}>{label}</Link>)}
        </nav>
        <Link className="button button-violet header-cta" href="/pilot" prefetch={false}>Join the Clinical Pilot</Link>
        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <List size={22} />}
        </button>
      </div>
      {open && (
        <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
          {links.map(([label, href]) => (
            <Link href={href} key={href} prefetch={false} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          <Link href="/pilot" prefetch={false} onClick={() => setOpen(false)}>Join the Clinical Pilot</Link>
        </nav>
      )}
    </header>
  );
}
