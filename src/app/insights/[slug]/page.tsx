import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { JsonLd } from "@/components/json-ld";
import { getAllInsights, getInsight } from "@/lib/insights";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, site, webPageJsonLd } from "@/lib/site";
import { InsightReadTracker } from "@/components/insight-read-tracker";

export async function generateStaticParams() {
  const insights = await getAllInsights(false);
  return insights.map(({ frontmatter }) => ({ slug: frontmatter.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const insight = await getInsight(slug);
  if (!insight || insight.frontmatter.draft) return {};
  const { frontmatter } = insight;
  const metadata = pageMetadata(frontmatter.title, frontmatter.description, `/insights/${slug}`);
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt || frontmatter.publishedAt,
      authors: [frontmatter.author],
      tags: frontmatter.tags,
    },
  };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = await getInsight(slug);
  if (!insight || insight.frontmatter.draft) notFound();
  const { frontmatter, content } = insight;
  const articleUrl = absoluteUrl(`/insights/${slug}`);
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Insights", path: "/insights" },
    { name: frontmatter.title, path: `/insights/${slug}` },
  ]);
  const webPage = {
    ...webPageJsonLd({ title: frontmatter.title, description: frontmatter.description, path: `/insights/${slug}` }),
    mainEntity: { "@id": `${articleUrl}#article` },
  };
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${articleUrl}#article`,
    headline: frontmatter.title,
    description: frontmatter.description,
    image: site.socialImageUrl,
    datePublished: frontmatter.publishedAt,
    dateModified: frontmatter.updatedAt || frontmatter.publishedAt,
    author: { "@type": "Organization", name: frontmatter.author },
    publisher: { "@id": site.organizationId },
    mainEntityOfPage: { "@id": `${articleUrl}#webpage` },
    isPartOf: { "@id": site.websiteId },
    about: { "@id": site.organizationId },
    inLanguage: site.language,
    articleSection: frontmatter.tags[0],
    keywords: frontmatter.tags,
    ...(frontmatter.reviewer
      ? { reviewedBy: { "@type": "Person", name: frontmatter.reviewer } }
      : {}),
    ...(frontmatter.sources.length > 0
      ? { citation: frontmatter.sources.map((source) => source.url) }
      : {}),
  };
  return (
    <main id="main-content">
      <article className="article">
        <InsightReadTracker />
        <JsonLd data={[breadcrumb, webPage, article]} />
        <header><p className="eyebrow">{frontmatter.tags[0]}</p><h1>{frontmatter.title}</h1><p className="lead">{frontmatter.description}</p><p className="article-meta">By {frontmatter.author} · Published {new Date(frontmatter.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}{frontmatter.reviewer ? ` · Reviewed by ${frontmatter.reviewer}${frontmatter.reviewedAt ? ` on ${new Date(frontmatter.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}` : ""}</p></header>
        <div className="article-body"><MDXRemote source={content} /></div>
        {frontmatter.sources.length > 0 && <section className="sources"><h2>Sources</h2><ul>{frontmatter.sources.map((source) => <li key={source.url}><a href={source.url} rel="noreferrer" target="_blank">{source.label}</a></li>)}</ul></section>}
      </article>
    </main>
  );
}
