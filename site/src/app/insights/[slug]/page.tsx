import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { JsonLd } from "@/components/json-ld";
import { getAllInsights, getInsight } from "@/lib/insights";
import { pageMetadata, site } from "@/lib/site";
import { InsightReadTracker } from "@/components/insight-read-tracker";

export async function generateStaticParams() {
  const insights = await getAllInsights(false);
  return insights.map(({ frontmatter }) => ({ slug: frontmatter.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const insight = await getInsight(slug);
  if (!insight || insight.frontmatter.draft) return {};
  return pageMetadata(insight.frontmatter.title, insight.frontmatter.description, `/insights/${slug}`);
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = await getInsight(slug);
  if (!insight || insight.frontmatter.draft) notFound();
  const { frontmatter, content } = insight;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.publishedAt,
    dateModified: frontmatter.updatedAt || frontmatter.publishedAt,
    author: { "@type": "Organization", name: frontmatter.author },
    publisher: { "@type": "Organization", name: site.legalName, url: site.url },
    mainEntityOfPage: new URL(`/insights/${slug}`, site.url).toString(),
    inLanguage: "en-IN",
  };
  return (
    <main id="main-content">
      <article className="article">
        <InsightReadTracker />
        <JsonLd data={jsonLd} />
        <header><p className="eyebrow">{frontmatter.tags[0]}</p><h1>{frontmatter.title}</h1><p className="lead">{frontmatter.description}</p><p className="article-meta">By {frontmatter.author} · Published {new Date(frontmatter.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}{frontmatter.reviewer ? ` · Reviewed by ${frontmatter.reviewer}` : ""}</p></header>
        <div className="article-body"><MDXRemote source={content} /></div>
        {frontmatter.sources.length > 0 && <section className="sources"><h2>Sources</h2><ul>{frontmatter.sources.map((source) => <li key={source.url}><a href={source.url} rel="noreferrer" target="_blank">{source.label}</a></li>)}</ul></section>}
      </article>
    </main>
  );
}
