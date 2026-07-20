"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main-content"><section className="page-hero"><div className="container"><p className="eyebrow">Something went wrong</p><h1>We could not load this page.</h1><p className="lead">No application information has been shown. You can try the page again.</p><div className="button-row"><button className="button button-primary" type="button" onClick={reset}>Try again</button></div></div></section></main>;
}
