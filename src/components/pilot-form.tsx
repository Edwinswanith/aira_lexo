"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

type FormErrors = Record<string, string>;

function track(name: string) {
  if (typeof window !== "undefined") {
    const plausible = (window as typeof window & { plausible?: (event: string) => void }).plausible;
    plausible?.(name);
  }
}

export function PilotApplicationForm() {
  const router = useRouter();
  const started = useRef(false);
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");

  function markStarted() {
    if (!started.current) {
      started.current = true;
      track("pilot_form_start");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setFormError("");

    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(window.location.search);
    const payload = {
      fullName: form.get("fullName"),
      email: form.get("email"),
      phone: form.get("phone"),
      role: form.get("role"),
      specialty: form.get("specialty"),
      organization: form.get("organization"),
      city: form.get("city"),
      otherCity: form.get("otherCity"),
      dailyPatientVolume: form.get("dailyPatientVolume"),
      documentationMethod: form.get("documentationMethod"),
      repeatVisitShare: form.get("repeatVisitShare"),
      pilotInterest: form.get("pilotInterest"),
      consentToContact: form.get("consentToContact") === "on",
        privacyPolicyVersion: "2026-11-06",
      source: form.get("source") || "website",
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      website: form.get("website"),
    };

    try {
      const response = await fetch("/api/pilot-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.status === 400) {
        setErrors(result.errors || {});
        setFormError(result.errors?.form || "Check the highlighted fields and try again.");
        track("pilot_form_error");
        return;
      }
      if (response.status === 429) {
        setFormError("We have received several applications from this network. Please try again in 15 minutes.");
        track("pilot_form_error");
        return;
      }
      if (!response.ok) {
        setFormError("We could not save your application right now. Please try again shortly.");
        track("pilot_form_error");
        return;
      }
      track(result.status === "future_access" ? "future_access_submit" : "pilot_form_submit");
      router.push(`/pilot/thanks?status=${encodeURIComponent(result.status)}`);
    } catch {
      setFormError("We could not connect to the application service. Please try again shortly.");
      track("pilot_form_error");
    } finally {
      setPending(false);
    }
  }

  const error = (field: string) => errors[field] ? <span className="field-error" id={`${field}-error`}>{errors[field]}</span> : null;
  const describedBy = (field: string) => errors[field] ? `${field}-error` : undefined;

  return (
    <form className="form-shell" onSubmit={submit} onChange={markStarted} noValidate>
      <div className="section-heading" style={{ marginBottom: 34 }}>
        <p className="eyebrow">Pilot application</p>
        <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)" }}>Tell us about your practice.</h2>
        <p className="muted">Do not enter patient names or medical information.</p>
      </div>
      {formError && <div className="form-status error" role="alert">{formError}</div>}
      <div className="form-grid">
        <div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" autoComplete="name" aria-invalid={Boolean(errors.fullName)} aria-describedby={describedBy("fullName")} required />{error("fullName")}</div>
        <div className="field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email")} required />{error("email")}</div>
        <div className="field"><label htmlFor="phone">Phone, optional</label><input id="phone" name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy("phone")} />{error("phone")}</div>
        <div className="field"><label htmlFor="role">Your role</label><select id="role" name="role" defaultValue="" aria-invalid={Boolean(errors.role)} aria-describedby={describedBy("role")} required><option value="" disabled>Select a role</option><option value="doctor">Doctor</option><option value="clinic_owner">Clinic owner</option><option value="hospital_admin">Hospital administrator</option><option value="other">Other</option></select>{error("role")}</div>
        <div className="field"><label htmlFor="specialty">Specialty or area of work</label><input id="specialty" name="specialty" autoComplete="organization-title" aria-invalid={Boolean(errors.specialty)} aria-describedby={describedBy("specialty")} required />{error("specialty")}</div>
        <div className="field"><label htmlFor="organization">Clinic or organization, optional</label><input id="organization" name="organization" autoComplete="organization" aria-invalid={Boolean(errors.organization)} aria-describedby={describedBy("organization")} />{error("organization")}</div>
        <div className="field"><label htmlFor="city">City</label><select id="city" name="city" value={city} onChange={(event) => setCity(event.target.value)} aria-invalid={Boolean(errors.city)} aria-describedby={describedBy("city")} required><option value="" disabled>Select a city</option><option value="chennai">Chennai</option><option value="bengaluru">Bengaluru</option><option value="hyderabad">Hyderabad</option><option value="mumbai">Mumbai</option><option value="coimbatore">Coimbatore</option><option value="other">Other city</option></select>{error("city")}</div>
        {city === "other" ? <div className="field"><label htmlFor="otherCity">Your city</label><input id="otherCity" name="otherCity" autoComplete="address-level2" aria-invalid={Boolean(errors.otherCity)} aria-describedby={describedBy("otherCity")} required />{error("otherCity")}</div> : <input type="hidden" name="otherCity" value="" />}
        <div className="field"><label htmlFor="dailyPatientVolume">Daily patient volume</label><select id="dailyPatientVolume" name="dailyPatientVolume" defaultValue="" aria-invalid={Boolean(errors.dailyPatientVolume)} aria-describedby={describedBy("dailyPatientVolume")} required><option value="" disabled>Select a range</option><option value="under_20">Under 20</option><option value="20_40">20 to 40</option><option value="41_60">41 to 60</option><option value="over_60">Over 60</option></select>{error("dailyPatientVolume")}</div>
        <div className="field"><label htmlFor="documentationMethod">Current documentation method</label><select id="documentationMethod" name="documentationMethod" defaultValue="" aria-invalid={Boolean(errors.documentationMethod)} aria-describedby={describedBy("documentationMethod")} required><option value="" disabled>Select a method</option><option value="paper">Paper</option><option value="emr">EMR</option><option value="dictation">Dictation</option><option value="mixed">Mixed methods</option><option value="other">Other</option></select>{error("documentationMethod")}</div>
        <div className="field"><label htmlFor="repeatVisitShare">Share of consultations that are repeat visits</label><select id="repeatVisitShare" name="repeatVisitShare" defaultValue="" aria-invalid={Boolean(errors.repeatVisitShare)} aria-describedby={describedBy("repeatVisitShare")} required><option value="" disabled>Select a range</option><option value="under_25">Under 25%</option><option value="25_50">25% to 50%</option><option value="over_50">Over 50%</option><option value="unsure">Not sure</option></select>{error("repeatVisitShare")}</div>
        <div className="field full"><label htmlFor="pilotInterest">What would you like the pilot to help you understand?</label><textarea id="pilotInterest" name="pilotInterest" maxLength={600} aria-invalid={Boolean(errors.pilotInterest)} aria-describedby={describedBy("pilotInterest")} />{error("pilotInterest")}<span className="muted" style={{ fontSize: 12 }}>Maximum 600 characters. Do not include patient information.</span></div>
        <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
        <input type="hidden" name="source" value="website" />
        <div className="field full">
          <label className="checkbox-row" htmlFor="consentToContact"><input id="consentToContact" name="consentToContact" type="checkbox" aria-invalid={Boolean(errors.consentToContact)} aria-describedby={describedBy("consentToContact")} required /><span>I have read the privacy notice and agree that Aira may contact me about this pilot application.</span></label>
          {error("consentToContact")}
        </div>
        <div className="field full"><button className="button button-violet" type="submit" disabled={pending}>{pending ? "Sending application" : "Submit application"}</button></div>
      </div>
    </form>
  );
}
