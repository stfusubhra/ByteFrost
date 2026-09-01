/* KisanSetu auth shell: a quiet, full-page two-column layout.
   Left: editorial agricultural visual + restrained brand copy.
   Right: the focused authentication form. */
import { Link } from "wouter";
import { Sprout } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";

export default function AuthLayout({
  children,
  tagline,
  support,
}: {
  children: React.ReactNode;
  tagline?: string;
  support?: string;
}) {
  const { t } = useLanguage();

  const displayTagline = tagline || t("signup.tagline");
  const displaySupport = support || t("signup.support");

  return (
    <div className="auth-shell">
      {/* Left — editorial visual + brand */}
      <aside className="auth-visual" aria-hidden="true">
        <div className="auth-visual-img" />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <Link href="/" className="auth-visual-wordmark">
            <Sprout size={16} />
            <span>KisanSetu</span>
          </Link>
          <div className="auth-visual-copy">
            <p className="auth-visual-tagline">{displayTagline}</p>
            <p className="auth-visual-support">{displaySupport}</p>
          </div>
        </div>
      </aside>

      {/* Right — the form */}
      <main className="auth-panel">
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px 0" }}>
          <LanguageSelector variant="dark" />
        </div>
        <div className="auth-panel-inner">
          <Link href="/" className="auth-mobile-wordmark" aria-label="KisanSetu home">
            <Sprout size={16} />
            <span>KisanSetu</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
