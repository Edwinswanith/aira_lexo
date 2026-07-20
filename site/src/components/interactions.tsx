"use client";

import { CheckCircle, HandTap, ShieldCheck } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

function track(name: string) {
  const plausible = (window as typeof window & { plausible?: (event: string) => void }).plausible;
  plausible?.(name);
}

const states = {
  READY: "The device is available and waiting for a doctor to begin.",
  REC: "A visible recording state supports clear consent and control.",
  SAVED: "The consultation is stored locally before secure transfer.",
  "SYNC PENDING": "The record is safe on the device until a connection is available.",
  SYNCED: "The consultation is available for structured review in the app.",
  ERROR: "A clear status helps the user understand what needs attention.",
};

export function TrustStrip() {
  return (
    <div className="trust-strip">
      <div className="container trust-strip-grid">
        <div className="trust-strip-item">
          <div className="trust-step-heading"><span>01</span><strong>Consent-first capture</strong></div>
          <span className="icon-disc"><HandTap size={20} /></span>
          <p>Recording starts only after clear patient consent.</p>
        </div>
        <div className="trust-strip-item">
          <div className="trust-step-heading"><span>02</span><strong>Doctor-reviewed records</strong></div>
          <span className="icon-disc"><CheckCircle size={20} /></span>
          <p>The doctor reviews and approves each structured draft.</p>
        </div>
        <div className="trust-strip-item">
          <div className="trust-step-heading"><span>03</span><strong>Clinical boundaries</strong></div>
          <span className="icon-disc"><ShieldCheck size={20} /></span>
          <p>No autonomous diagnosis or prescribing.</p>
        </div>
      </div>
    </div>
  );
}

export function DeviceStateSimulator() {
  const [active, setActive] = useState<keyof typeof states>("READY");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <div className="state-board">
      <div className="state-screen" role="tabpanel" aria-live="polite">
        <div><strong>{active}</strong><p>{states[active]}</p></div>
      </div>
      <div className="state-tabs" role="tablist" aria-label="Device states">
        {Object.keys(states).map((state) => (
          <button
            className="state-tab"
            type="button"
            role="tab"
            aria-selected={active === state}
            key={state}
            disabled={!hydrated}
            onClick={() => { setActive(state as keyof typeof states); track("device_state_change"); }}
          >
            {state}
          </button>
        ))}
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
