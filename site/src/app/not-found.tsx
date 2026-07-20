import Link from "next/link";

export default function NotFound() {
  return <main id="main-content"><section className="page-hero"><div className="container"><p className="eyebrow">404</p><h1>This page is not part of the record.</h1><p className="lead">The address may have changed, or the page may not exist.</p><div className="button-row"><Link className="button button-primary" href="/">Return home</Link></div></div></section></main>;
}
