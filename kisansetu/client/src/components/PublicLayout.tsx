/* KisanSetu public shell: editorial navigation shared by public pages. Includes auth links, drawer, progress indicator, and responsive footer. */
import { Link } from "wouter";
import { ArrowUpRight, Mail, MapPin, Menu, Sprout, X, LogOut, User } from "lucide-react";
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
      .querySelectorAll(".public-reveal")
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
    { href: "/", label: "Home", index: "01" },
    { href: "/marketplace", label: "Marketplace", index: "02" },
    { href: "/market-match", label: "Find your market match", index: "03" },
    { href: "/story", label: "Our story", index: "04" },
    { href: "/faq", label: "FAQ", index: "05" },
    { href: "/contact", label: "Contact", index: "06" },
    ...(hasToken
      ? [{ href: "/dashboard", label: "Product Dashboard", index: "07" }]
      : [
          { href: "/login", label: "Sign in", index: "07" },
          { href: "/signup", label: "Create account", index: "08" },
        ]),
  ];

  return (
    <div className="public-site">
      <div
        className="public-scrollbar"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
      <div className="public-announcement">{eyebrow}</div>

      <header className="public-header">
        <button
          className="public-menu-trigger"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>

        <Link href="/" className="public-wordmark">
          <span>
            <Sprout size={15} />
          </span>
          KisanSetu
        </Link>

        <nav className="public-nav" style={{ alignItems: "center", gap: "14px" }}>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/market-match">Find your match</Link>
          {hasToken ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <button
                onClick={handleLogout}
                className="public-auth-btn outline"
                style={{ cursor: "pointer" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="public-auth-btn outline">
                Sign in
              </Link>
              <Link href="/signup" className="public-auth-btn solid">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      {open && (
        <div className="public-drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="public-drawer-top">
            <button
              className="public-drawer-close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>
          <div className="public-drawer-links">
            {menuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                <span className="public-drawer-index">{link.index}</span>
                <span className="public-drawer-label">{link.label}</span>
                <ArrowUpRight className="public-drawer-arrow" size={20} />
              </Link>
            ))}
            {hasToken && (
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f4f3ee",
                  display: "flex",
                  alignItems: "center",
                  gap: "22px",
                  padding: "15px 0",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "inherit",
                }}
              >
                <span className="public-drawer-index">08</span>
                <span className="public-drawer-label">Sign out</span>
                <LogOut className="public-drawer-arrow" size={20} />
              </button>
            )}
          </div>
          <div className="public-drawer-foot">
            <span>Market, made clearer.</span>
            <a href="mailto:hello@kisansetu.in">hello@kisansetu.in</a>
          </div>
        </div>
      )}

      <main>{children}</main>

      <footer className="public-footer">
        <div className="public-footer-brand">
          <Link href="/" className="public-wordmark">
            <span>
              <Sprout size={15} />
            </span>
            KisanSetu
          </Link>
          <p>
            Direct market intelligence for everyday farming. We bring supply,
            demand, and the route between them into one clearer view.
          </p>
          <div className="public-footer-contact">
            <span>
              <MapPin size={13} /> Nashik · Pune · Remote
            </span>
            <a href="mailto:hello@kisansetu.in">
              <Mail size={13} /> hello@kisansetu.in
            </a>
          </div>
        </div>

        <div className="public-footer-col">
          <span className="public-footer-head">Explore</span>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/market-match">Market match</Link>
          <Link href="/dashboard">Product</Link>
        </div>

        <div className="public-footer-col">
          <span className="public-footer-head">Account</span>
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

        <div className="public-footer-cta">
          <span className="public-footer-head">Get started</span>
          <p>See what a clearer market looks like for your produce.</p>
          <Link className="public-pill" href="/market-match">
            Find your match <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="public-footer-bottom">
          <span>© {new Date().getFullYear()} KisanSetu. Market, made clearer.</span>
          <span>Built for farmers, buyers, and the people between them.</span>
        </div>
      </footer>
    </div>
  );
}
