import Link from "next/link";
import { PageHero } from "@/components/page-sections";
import { getAllInsights } from "@/lib/insights";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Insights", "Evidence-aware articles about consultation memory, doctor review, consent, and responsible clinical AI pilots.", "/insights");

export default async function InsightsPage() {
  const insights = await getAllInsights(false);
  return (
    <main id="main-content">
      <PageHero eyebrow="Insights" path="/insights" title="Clear thinking about consultation memory." description="We publish evidence-aware explanations, distinguish category research from Aira's own results, and add clinical review before health-related articles go live." />
      <section className="section"><div className="container">
        <div className="article-grid">
          {insights.map(({ frontmatter }) => <Link className="article-card" href={`/insights/${frontmatter.slug}`} key={frontmatter.slug}><span className="tag">{frontmatter.tags[0]}</span><div><h3>{frontmatter.title}</h3><p>{frontmatter.description}</p><span className="article-meta">{new Date(frontmatter.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div></Link>)}
        </div>
        <p className="notice" style={{ marginTop: 40 }}>Health-related drafts remain unpublished until a named clinical reviewer, review date, and evidence sources are recorded.</p>
      </div></section>
    </main>
  );
}
