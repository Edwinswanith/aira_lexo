import { completeLogin } from "../actions";

export const dynamic = "force-dynamic";

/**
 * The emailed link opens this page instead of signing in directly, because
 * email security scanners open links automatically and would use up the token.
 */
export default async function AdminVerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="admin-login form-shell">
      <p className="eyebrow">Aira order desk</p>
      <h1 className="admin-title">Confirm sign in</h1>
      <form action={completeLogin} className="admin-login-form">
        <input type="hidden" name="token" value={token || ""} />
        <button className="button button-violet" type="submit">Sign in to the order desk</button>
      </form>
    </div>
  );
}
