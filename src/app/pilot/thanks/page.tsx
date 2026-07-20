import Link from "next/link";
import { pageMetadata } from "@/lib/site";

export const metadata = {
  ...pageMetadata("Application received", "Thank you for your interest in the Aira clinical pilot.", "/pilot/thanks"),
  robots: { index: false, follow: false },
};

export default async function PilotThanksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const future = status === "future_access";
  const duplicate = status === "already_received";
  const title = future ? "You are on the future-access list." : duplicate ? "We already have your application." : "Your application is with us.";
  const text = future
    ? "Your city is outside the first pilot group. We have saved your interest and will contact you when Aira expands to your area."
    : duplicate
      ? "We received an application from this email address within the last 30 days. There is no need to submit it again."
      : "Thank you for taking the time to apply. We will review the fit and contact you if the next pilot conversation makes sense.";
  return <main id="main-content"><section className="page-hero"><div className="container"><p className="eyebrow">Thank you</p><h1>{title}</h1><p className="lead">{text}</p><div className="button-row"><Link className="button button-primary" href="/">Return home</Link><Link className="button button-secondary" href="/product">Explore Aira</Link></div></div></section></main>;
}
