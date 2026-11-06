import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="site-footer" id="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand" href="/" aria-label="Aira home">
              <span className="brand-logo-shell" aria-hidden="true">
                <Image className="brand-logo" src="/images/aira-logo-mark-256.png" alt="" width={36} height={36} />
              </span>
              <span>Aira</span>
            </Link>
            <p>Consultation memory designed for doctor review, patient consent, and better context at the next visit.</p>
          </div>
          <nav className="footer-links" aria-label="Product links">
            <strong>Explore</strong>
            <Link href="/product">Product</Link>
            <Link href="/for-doctors">For Doctors</Link>
            <Link href="/for-clinics">For Clinics</Link>
            <Link href="/trust">Trust</Link>
            <Link href="/insights">Insights</Link>
          </nav>
          <nav className="footer-links" aria-label="Company and legal links">
            <strong>Company</strong>
            <Link href="/about">About</Link>
            <Link href="/founders">Founders</Link>
            <Link href="/patient-information">Patient Information</Link>
            <Link href="/pilot">Join the Pilot</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/data-deletion">Data Deletion</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AiraLexo Solutions Private Limited</span>
          <span>Built in India for considered clinical use.</span>
        </div>
      </div>
    </footer>
  );
}
