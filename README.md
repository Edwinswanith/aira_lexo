# Aira website

The public website for Aira, a prototype-stage consultation memory system from Aira Lexo Solutions Private Limited.

## Stack

- Next.js App Router with strict TypeScript
- Tailwind CSS plus custom property design tokens
- Repository-managed MDX Insights
- Supabase server-side lead storage
- Resend application notifications
- Plausible cookieless analytics
- Vitest and Playwright

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add available credentials.
3. Run `npm run dev`.

When Supabase and Resend are not configured, local development uses a memory-only form response so the complete user journey can be tested. Production fails safely until storage credentials are present.

## Data setup

Apply `supabase/migrations/001_pilot_applications.sql` to the private Supabase project. Only the server route uses the service role. Do not expose the service role through a public environment variable.

The scheduled Vercel job retries notification failures and deletes application rows older than 12 months. Set `CRON_SECRET` for authorized calls.

## Quality checks

- `npm run check:content` fails if a public source file contains an em dash character.
- `npm run check:seo` validates Insight metadata, dates, slugs, sources, and publication review requirements.
- `npm run typecheck` checks strict TypeScript.
- `npm test` runs unit tests.
- `npm run test:e2e` runs desktop and mobile browser tests.
- `npm run build` performs the content check and production build.

## Content rules

- Use Aira in public headings.
- Use Aira Lexo Solutions Private Limited in legal contexts.
- Mark every product render with `Concept render. Final product may vary.`
- Do not claim autonomous diagnosis, prescribing, certification, compliance, accuracy, or clinical performance.
- Keep health-related Insights unpublished until a named clinical reviewer, review date, and appropriate sources are present.

## Brand and prototype assets

- `public/images/aira-logo-mark.png` is the full-resolution transparent Aira mark.
- `public/images/aira-logo-mark-256.png` is the compact website and browser-icon version.
- `public/images/prototype/` contains supplied photographs of an early working hardware prototype.
- The visible Neura name in prototype photographs was temporary. Public copy must keep it separate from the current Aira brand.

## Production launch checklist

1. Create protected Vercel preview and production environments.
2. Add all variables from `.env.example`.
3. Add `airalexo.in` and `www.airalexo.in` to Vercel.
4. Apply only the DNS records supplied by Vercel. Preserve all mail records.
5. Point the apex to production and verify the permanent `www` redirect.
6. Verify SSL on both hostnames and confirm the parked `/lander` page is gone.
7. Run production form storage and email delivery tests.
8. Validate metadata, JSON-LD, `robots.txt`, and `sitemap.xml`.
9. Add the property to Google Search Console and Bing Webmaster Tools.
10. Submit the sitemap, enable IndexNow, and configure uptime checks for the homepage and pilot API.

Preview deployments receive a `noindex, nofollow` response header. Production indexing should be enabled only after final content, legal, clinical, accessibility, and domain checks pass.

## SEO and agent visibility

- Canonical URLs use `https://airalexo.in` and English India language metadata.
- Server-rendered pages include WebSite, Organization, WebPage, BreadcrumbList, FAQPage, ItemList, and Article structured data where relevant.
- Production `robots.txt` allows Googlebot, Bingbot, ChatGPT-User, OAI-SearchBot, and GPTBot to crawl public pages. API routes remain disallowed.
- `/llms.txt` provides a concise Markdown guide to canonical product, trust, pilot, policy, and published Insight pages. It is generated from production content and excludes drafts.
- Draft Insights stay out of production pages and the sitemap.
- Health-related Insights require a named reviewer, review date, and at least one source before publication.
- Preview deployments are blocked from indexing through metadata and `robots.txt`.

Set `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` in the Vercel production environment after creating the respective webmaster properties. Then submit `https://airalexo.in/sitemap.xml` in both tools. IndexNow setup requires a separate public key file and webmaster verification before changed URLs can be submitted.
