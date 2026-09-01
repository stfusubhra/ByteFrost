/* KisanSetu public shell: shared header + footer for public pages. Includes auth links, responsive drawer, scroll progress, footer, and language selector. */
import { Link } from "wouter";
import { ArrowUpRight, Mail, MapPin, Menu, Moon, Sprout, Sun, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useReveal } from "../hooks/useReveal";
import LanguageSelector from "./LanguageSelector";

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
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
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
    { href: "/", label: t("nav.home") },
    { href: "/marketplace", label: t("nav.marketplace") },
    { href: "/market-match", label: t("nav.findmatchFull") },
    { href: "/story", label: t("nav.story") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/contact", label: t("nav.contact") },
    ...(hasToken
      ? [{ href: "/dashboard", label: t("nav.dashboard") }]
      : [
          { href: "/login", label: t("nav.signin") },
          { href: "/signup", label: t("nav.createAccount") },
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
            <Link href="/marketplace">{t("nav.marketplace")}</Link>
            <Link href="/market-match">{t("nav.findmatch")}</Link>
            <Link href="/story">{t("nav.story")}</Link>
            <Link href="/faq">{t("nav.faq")}</Link>
          </nav>

          <div className="site-header-actions">
            <LanguageSelector variant="dark" />
            {toggleTheme && (
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? t("common.switchToLight") : t("common.switchToDark")}
                title={theme === "dark" ? t("common.switchToLight") : t("common.switchToDark")}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
            <div className="header-auth-desktop">
              {hasToken ? (
                <>
                  <Link href="/dashboard" className="btn btn-secondary btn-sm">
                    {t("nav.dashboard")}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm"
                    style={{ cursor: "pointer" }}
                  >
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost btn-sm">
                    {t("nav.signin")}
                  </Link>
                  <Link href="/signup" className="btn btn-primary btn-sm">
                    {t("nav.signup")}
                  </Link>
                </>
              )}
            </div>
            <button
              className="menu-btn"
              onClick={() => setOpen(true)}
              aria-label={t("common.openMenu")}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <>
          <div
            className="drawer-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="drawer" role="dialog" aria-modal="true" aria-label={t("common.openMenu")}>
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
                aria-label={t("common.closeMenu")}
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
                  {t("nav.signout")}
                  <LogOut size={18} />
                </button>
              )}
            </div>
            <div className="drawer-foot">
              <span>{t("footer.tagline")}</span>
              <a href="mailto:hello@kisansetu.in">hello@kisansetu.in</a>
            </div>
          </div>
        </>
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
              <p>{t("footer.brand.p")}</p>
              <div className="site-footer-contact">
                <span>
                  <MapPin size={13} /> {t("footer.contact.locations")}
                </span>
                <a href="mailto:hello@kisansetu.in">
                  <Mail size={13} /> hello@kisansetu.in
                </a>
              </div>
            </div>

            <div className="site-footer-col">
              <span className="site-footer-head">{t("footer.explore")}</span>
              <Link href="/marketplace">{t("nav.marketplace")}</Link>
              <Link href="/market-match">{t("footer.marketMatch")}</Link>
              <Link href="/story">{t("nav.story")}</Link>
              <Link href="/faq">{t("nav.faq")}</Link>
            </div>

            <div className="site-footer-col">
              <span className="site-footer-head">{t("footer.account")}</span>
              {hasToken ? (
                <>
                  <Link href="/dashboard">{t("nav.dashboard")}</Link>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    {t("nav.signout")}
                  </a>
                </>
              ) : (
                <>
                  <Link href="/login">{t("nav.signin")}</Link>
                  <Link href="/signup">{t("nav.createAccount")}</Link>
                </>
              )}
            </div>

            <div className="site-footer-cta">
              <span className="site-footer-head">{t("footer.getStarted")}</span>
              <p>{t("footer.cta.p")}</p>
              <Link className="btn btn-primary" href="/market-match">
                {t("footer.cta.link")} <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          <div className="site-footer-bottom">
            <span>© {new Date().getFullYear()} {t("footer.copyright")}</span>
            <span>{t("footer.built")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
