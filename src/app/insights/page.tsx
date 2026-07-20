import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-sections";
import { getAllInsights } from "@/lib/insights";
import { absoluteUrl, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Clinical AI and consultation documentation insights", "Read evidence-aware articles about consultation memory, doctor review, recording consent, and responsible clinical AI pilots.", "/insights");

export default async function InsightsPage() {
  const insights = await getAllInsights(false);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${absoluteUrl("/insights")}#articles`,
    name: "Aira Insights",
    numberOfItems: insights.length,
    itemListElement: insights.map(({ frontmatter }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: frontmatter.title,
      url: absoluteUrl(`/insights/${frontmatter.slug}`),
    })),
  };
  return (
    <main id="main-content">
      <JsonLd data={itemList} />
      <PageHero eyebrow="Insights" path="/insights" schemaType="CollectionPage" title="Clear thinking about consultation memory." description="We publish evidence-aware explanations, distinguish category research from Aira's own results, and add clinical review before health-related articles go live." />
      <section className="section"><div className="container">
        <div className="article-grid">
          {insights.map(({ frontmatter }) => <Link className="article-card" href={`/insights/${frontmatter.slug}`} key={frontmatter.slug}><span className="tag">{frontmatter.tags[0]}</span><div><h3>{frontmatter.title}</h3><p>{frontmatter.description}</p><span className="article-meta">{new Date(frontmatter.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div></Link>)}
        </div>
        <p className="notice" style={{ marginTop: 40 }}>Health-related drafts remain unpublished until a named clinical reviewer, review date, and evidence sources are recorded.</p>
      </div></section>
    </main>
  );
}
