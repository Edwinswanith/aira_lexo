"use client";

import { CheckCircle, ShieldCheck, UserCheck } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

function track(name: string) {
  const plausible = (window as typeof window & { plausible?: (event: string) => void }).plausible;
  plausible?.(name);
}

export function TrustStrip() {
  return (
    <div className="trust-strip" aria-label="Aira product boundaries">
      <div className="trust-strip-grid">
        <div className="trust-strip-item">
          <span className="icon-disc"><CheckCircle size={22} /></span>
          <strong>Consent-first capture</strong>
        </div>
        <div className="trust-strip-item">
          <span className="icon-disc"><UserCheck size={22} /></span>
          <strong>Doctor-reviewed records</strong>
        </div>
        <div className="trust-strip-item">
          <span className="icon-disc"><ShieldCheck size={22} /></span>
          <strong>No autonomous diagnosis or prescribing</strong>
        </div>
      </div>
    </div>
  );
}

const perspectives = {
  Doctor: {
    title: "Stay present, then review the record.",
    text: "Aira is designed to capture the consultation with consent, prepare a structured draft, and keep the doctor responsible for the final clinical record.",
  },
  Clinic: {
    title: "Introduce a clear, measurable workflow.",
    text: "Clinic teams can define who uses Aira, how records are reviewed, and what a responsible pilot should measure before wider adoption.",
  },
  Patient: {
    title: "Know when recording begins and why.",
    text: "Patients should receive a plain-language explanation, have a real choice, and understand who can access the approved record.",
  },
};

export function PerspectiveSwitcher() {
  const [active, setActive] = useState<keyof typeof perspectives>("Doctor");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const item = perspectives[active];

  return (
    <div>
      <div className="perspective-tabs" role="tablist" aria-label="Choose a perspective">
        {Object.keys(perspectives).map((perspective) => (
          <button
            className="perspective-tab"
            type="button"
            role="tab"
            aria-selected={active === perspective}
            key={perspective}
            disabled={!hydrated}
            onClick={() => { setActive(perspective as keyof typeof perspectives); track("perspective_change"); }}
          >
            {perspective}
          </button>
        ))}
      </div>
      <div className="perspective-panel" role="tabpanel" aria-live="polite">
        <p className="eyebrow" style={{ color: "white" }}>{active} perspective</p>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </div>
    </div>
  );
}
