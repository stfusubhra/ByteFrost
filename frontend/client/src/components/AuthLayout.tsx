/* KisanSetu auth shell: a quiet, full-page two-column layout.
   Left: editorial agricultural visual + restrained brand copy.
   Right: the focused authentication form.
   No marketing navbar, no footer, no decorative cards. */
import { Link } from "wouter";
import { Sprout } from "lucide-react";

const AUTH_IMAGE =
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=80";

export default function AuthLayout({
  children,
  tagline = "Connecting the people who grow with the people who need.",
  support = "Direct markets. Better decisions. Smarter movement.",
}: {
  children: React.ReactNode;
  tagline?: string;
  support?: string;
}) {
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
            <p className="auth-visual-tagline">{tagline}</p>
            <p className="auth-visual-support">{support}</p>
          </div>
        </div>
      </aside>

      {/* Right — the form */}
      <main className="auth-panel">
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
