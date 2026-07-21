import type { InsightFrontmatter } from "./insights";
import { absoluteUrl, site } from "./site";

type PublicInsight = Pick<InsightFrontmatter, "description" | "slug" | "title">;

function markdownLink(label: string, path: string, description: string) {
  return `- [${label}](${absoluteUrl(path)}): ${description}`;
}

export function buildLlmsText(insights: PublicInsight[]) {
  const insightLinks = insights.map(({ description, slug, title }) =>
    markdownLink(title, `/insights/${slug}`, description),
  );

  return [
    `# ${site.name}`,
    "",
    "> Aira is a pilot-stage, doctor-controlled AI consultation memory system from Aira Lexo Solutions Private Limited in India.",
    "",
    "Aira is designed for consent-first consultation capture, structured draft records, doctor review, and approved context at return visits.",
    "Aira does not autonomously diagnose, prescribe, or replace clinical judgment. Product capabilities described on this website remain subject to pilot, clinical, legal, and technical validation.",
    `Initial pilot cities are ${site.pilotCities.join(", ")}. Applicants from other cities can join the future-access list.`,
    "Use the linked public pages as the canonical source for current information about Aira.",
    "",
    "## Product and audiences",
    "",
    markdownLink("Product", "/product", "The concept recorder, review app, structured record, and continuity workflow."),
    markdownLink("For Doctors", "/for-doctors", "How Aira is intended to support attention, documentation, repeat visits, and doctor control."),
    markdownLink("For Clinics", "/for-clinics", "Pilot onboarding, deployment, clinic workflows, support, and future integration considerations."),
    "",
    "## Trust and participation",
    "",
    markdownLink("Trust", "/trust", "Consent, privacy, security, retention, deletion, access control, auditability, and doctor approval."),
    markdownLink("Patient Information", "/patient-information", "A plain-language explanation of consultation recording, patient choice, access, and data rights."),
    markdownLink("Clinical Pilot", "/pilot", "Pilot eligibility, supported cities, expected participation, and the application form."),
    markdownLink("About Aira", "/about", "The public brand, legal entity, product stage, scope, and company approach."),
    "",
    "## Insights",
    "",
    markdownLink("Insights index", "/insights", "Published articles about consultation memory, doctor review, consent, and responsible clinical AI."),
    ...insightLinks,
    "",
    "## Policies",
    "",
    markdownLink("Privacy", "/privacy", "Website data and pilot application privacy information."),
    markdownLink("Terms", "/terms", "Website and pilot application terms."),
    "",
  ].join("\n");
}
