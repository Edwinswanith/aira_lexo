import { requestLoginLink } from "../actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  expired: "That sign-in link has expired or was already used. Request a new one.",
  unavailable: "The order desk cannot reach its database right now. Try again shortly.",
  rate_limited: "Too many sign-in requests from this network. Wait 15 minutes and try again.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  return (
    <div className="admin-login form-shell">
      <p className="eyebrow">Aira order desk</p>
      <h1 className="admin-title">Sign in</h1>
      {sent ? (
        <div className="form-status" role="status">If that email is on the team list, a sign-in link is on its way. It works once and expires in 15 minutes.</div>
      ) : (
        <p className="muted">Enter your work email and we will send you a one-time sign-in link.</p>
      )}
      {error && errors[error] && <div className="form-status error" role="alert">{errors[error]}</div>}
      <form action={requestLoginLink} className="admin-login-form">
        <div className="field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
        <button className="button button-violet" type="submit">Email me a sign-in link</button>
      </form>
    </div>
  );
}
