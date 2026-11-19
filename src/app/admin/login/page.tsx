import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { requestLoginLink } from "../actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  expired: "That sign-in link has expired or was already used. Request a new one.",
  unavailable: "The order desk cannot reach its database right now. Try again shortly.",
  rate_limited: "Too many sign-in requests from this network. Wait 15 minutes and try again.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;

  if (sent) {
    return (
      <div className="admin-login form-shell">
        <p className="eyebrow">Aira order desk</p>
        <h1 className="admin-title">Check your inbox</h1>
        <div className="admin-sent" role="status">
          <span className="order-state-label">LINK SENT</span>
          <p>If that email is on the team list, a sign-in link is on its way. Open it in this browser. It works once and expires in 15 minutes.</p>
        </div>
        <p className="muted">Nothing after 2 minutes? Check spam, then <Link href="/admin/login">send another link</Link>.</p>
      </div>
    );
  }

  return (
    <div className="admin-login form-shell">
      <p className="eyebrow">Aira order desk</p>
      <h1 className="admin-title">Sign in</h1>
      <p className="muted">Enter your work email and we will send you a one-time sign-in link.</p>
      {error && errors[error] && <div className="form-status error" role="alert">{errors[error]}</div>}
      <form action={requestLoginLink} className="admin-login-form">
        <div className="field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
        <SubmitButton pendingText="Sending link…">Email me a sign-in link</SubmitButton>
      </form>
    </div>
  );
}
