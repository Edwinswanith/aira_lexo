import { PageHero } from "@/components/page-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Website and pilot application terms", "Terms for using the Aira public website, reading prototype-stage product information, and submitting a clinical pilot application.", "/terms");

export default function TermsPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Terms" path="/terms" title="Terms for this website." description="These terms cover use of the public Aira website and pilot application. Separate reviewed terms will apply before any live clinical deployment." />
      <section className="legal">
        <p><strong>Version:</strong> 20 July 2026</p>
        <h2>About this site</h2>
        <p>This website is operated by Aira Lexo Solutions Private Limited. It describes a prototype-stage product and invites expressions of interest in a clinical pilot.</p>
        <h2>No medical advice</h2>
        <p>Website content is general product information. It is not medical advice and should not be used to make a diagnosis, prescription, or treatment decision.</p>
        <h2>Product stage</h2>
        <p>Product images are concept renders. Described features, workflows, and timelines may change through design, validation, legal review, and pilot learning. Applying does not create a promise of selection, availability, or a commercial relationship.</p>
        <h2>Acceptable use</h2>
        <p>Do not misuse the website, interfere with its operation, attempt unauthorized access, submit false information, or include patient names or medical information in the pilot form.</p>
        <h2>Content and ownership</h2>
        <p>Unless stated otherwise, website content, branding, and original product concepts belong to Aira Lexo Solutions Private Limited or are used with permission.</p>
        <h2>External sources</h2>
        <p>Insights may link to external research and guidance. Those sources remain under their publishers' control, and a link does not imply endorsement of every statement they contain.</p>
        <h2>Availability and liability</h2>
        <p>We work to keep the website accurate and available, but cannot promise uninterrupted access or that every item is complete. Any limits of liability remain subject to applicable law.</p>
        <h2>Contact</h2>
        <p>Questions about these terms can be sent to <a href="mailto:legal@airalexo.in">legal@airalexo.in</a>.</p>
      </section>
    </main>
  );
}
