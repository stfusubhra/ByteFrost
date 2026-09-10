/* KisanSetu public shell: minimal header + footer for public pages.
   Header: wordmark left, four links, auth actions right. Sticky with a
   hairline border; solid background once scrolled. */
import { Link } from "wouter";
import { Menu, Moon, Sprout, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useReveal } from "../hooks/useReveal";
import LanguageSelector from "./LanguageSelector";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  useReveal();

  useEffect(() => {
    setHasToken(!!localStorage.getItem("kisansetu_token"));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("kisansetu_token");
    setHasToken(false);
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/marketplace", label: t("nav.marketplace") },
    { href: "/market-match", label: t("nav.findmatch") },
    { href: "/story", label: t("nav.story") },
    { href: "/about", label: t("nav.about") },
  ];

  return (
    <div className="site">
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container site-header-inner">
          <Link href="/" className="wordmark" aria-label="KisanSetu home">
            <span className="wordmark-mark">
              <Sprout size={15} />
            </span>
            KisanSetu
          </Link>

          <nav className="site-nav" aria-label="Primary">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="site-header-actions">
            <LanguageSelector variant="dark" />
{toggleTheme && null}
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
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {hasToken ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    {t("nav.dashboard")}
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                  >
                    {t("nav.signout")}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    {t("nav.signin")}
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    {t("nav.signup")}
                  </Link>
                </>
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
              <a href="mailto:hello@kisansetu.in">hello@kisansetu.in</a>
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