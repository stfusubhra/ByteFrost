/* KisanSetu public shell: shared header + footer for public pages. Includes auth links, responsive drawer, scroll progress, and footer. */
import { Link } from "wouter";
import { ArrowUpRight, Mail, MapPin, Menu, Sprout, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? window.scrollY / max : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return progress;
}

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) =>
          entry.target.classList.toggle("is-visible", entry.isIntersecting)
        ),
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
    );
    document
      .querySelectorAll(".reveal")
      .forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export default function PublicLayout({
  children,
  eyebrow = "Direct market intelligence for everyday farming",
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const progress = useScrollProgress();
  useReveal();

  useEffect(() => {
    setHasToken(!!localStorage.getItem("kisansetu_token"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("kisansetu_token");
    setHasToken(false);
    window.location.href = "/";
  };

  const menuLinks = [
    { href: "/", label: "Home" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/market-match", label: "Find your market match" },
    { href: "/story", label: "Our story" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
    ...(hasToken
      ? [{ href: "/dashboard", label: "Dashboard" }]
      : [
          { href: "/login", label: "Sign in" },
          { href: "/signup", label: "Create account" },
        ]),
  ];

  return (
    <div className="site">
      <div
        className="site-scrollbar"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />

      <header className="site-header">
        <div className="container site-header-inner">
          <Link href="/" className="wordmark">
            <span className="wordmark-mark">
              <Sprout size={15} />
            </span>
            KisanSetu
          </Link>

          <nav className="site-nav" aria-label="Primary">
            <Link href="/marketplace">Marketplace</Link>
            <Link href="/market-match">Find your match</Link>
            <Link href="/story">Our story</Link>
            <Link href="/faq">FAQ</Link>
          </nav>

          <div className="site-header-actions">
            {hasToken ? (
              <>
                <Link href="/dashboard" className="btn btn-secondary btn-sm">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm"
                  style={{ cursor: "pointer" }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm">
                  Sign in
                </Link>
                <Link href="/signup" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </>
            )}
            <button
              className="menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="drawer-top">
            <Link href="/" className="wordmark" onClick={() => setOpen(false)}>
              <span className="wordmark-mark">
                <Sprout size={15} />
              </span>
              KisanSetu
            </Link>
            <button
              className="drawer-close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <div className="drawer-links">
            {menuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
                <ArrowUpRight size={18} />
              </Link>
            ))}
            {hasToken && (
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
              >
                Sign out
                <LogOut size={18} />
              </button>
            )}
          </div>
          <div className="drawer-foot">
            <span>Market, made clearer.</span>
            <a href="mailto:hello@kisansetu.in">hello@kisansetu.in</a>
          </div>
        </div>
      )}

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div className="site-footer-grid">
            <div className="site-footer-brand">
              <Link href="/" className="wordmark">
                <span className="wordmark-mark">
                  <Sprout size={15} />
                </span>
                KisanSetu
              </Link>
              <p>
                Direct market intelligence for everyday farming. We bring supply,
                demand, and the route between them into one clearer view.
              </p>
              <div className="site-footer-contact">
                <span>
                  <MapPin size={13} /> Nashik · Pune · Remote
                </span>
                <a href="mailto:hello@kisansetu.in">
                  <Mail size={13} /> hello@kisansetu.in
                </a>
              </div>
            </div>

            <div className="site-footer-col">
              <span className="site-footer-head">Explore</span>
              <Link href="/marketplace">Marketplace</Link>
              <Link href="/market-match">Market match</Link>
              <Link href="/story">Our story</Link>
              <Link href="/faq">FAQ</Link>
            </div>

            <div className="site-footer-col">
              <span className="site-footer-head">Account</span>
              {hasToken ? (
                <>
                  <Link href="/dashboard">Dashboard</Link>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    Sign out
                  </a>
                </>
              ) : (
                <>
                  <Link href="/login">Sign in</Link>
                  <Link href="/signup">Create account</Link>
                </>
              )}
            </div>

            <div className="site-footer-cta">
              <span className="site-footer-head">Get started</span>
              <p>See what a clearer market looks like for your produce.</p>
              <Link className="btn btn-primary" href="/market-match">
                Find your match <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          <div className="site-footer-bottom">
            <span>© {new Date().getFullYear()} KisanSetu. Market, made clearer.</span>
            <span>Built for farmers, buyers, and the people between them.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
