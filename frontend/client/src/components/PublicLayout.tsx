/* KisanSetu public shell: editorial navigation shared by public pages. Includes auth links, drawer, progress indicator, and responsive footer. */
import { Link } from "wouter";
import { ArrowUpRight, Mail, MapPin, Menu, Sprout, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
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
  eyebrow,
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const progress = useScrollProgress();
  const { t } = useLanguage();
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
    { href: "/", label: t("nav.home"), index: "01" },
    { href: "/marketplace", label: t("nav.marketplace"), index: "02" },
    { href: "/market-match", label: t("nav.findmatchFull"), index: "03" },
    { href: "/story", label: t("nav.story"), index: "04" },
    { href: "/faq", label: t("nav.faq"), index: "05" },
    { href: "/contact", label: t("nav.contact"), index: "06" },
    ...(hasToken
      ? [{ href: "/dashboard", label: t("nav.productDashboard"), index: "07" }]
      : [
          { href: "/login", label: t("nav.signin"), index: "07" },
          { href: "/signup", label: t("nav.createAccount"), index: "08" },
        ]),
  ];

  return (
    <div className="public-site">
      <div
        className="public-scrollbar"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
      <div className="public-announcement">{eyebrow ?? t("announce.default")}</div>

      <header className="public-header">
        <button
          className="public-menu-trigger"
          onClick={() => setOpen(true)}
          aria-label={t("common.openMenu")}
        >
          <Menu size={18} />
          <span>{t("common.openMenu")}</span>
        </button>

        <Link href="/" className="public-wordmark">
          <span>
            <Sprout size={15} />
          </span>
          KisanSetu
        </Link>

        <nav className="public-nav" style={{ alignItems: "center", gap: "14px" }}>
          <Link href="/marketplace">{t("nav.marketplace")}</Link>
          <Link href="/market-match">{t("nav.findmatch")}</Link>
          <LanguageSelector variant="dark" />
          {hasToken ? (
            <>
              <Link href="/dashboard">{t("nav.dashboard")}</Link>
              <button
                onClick={handleLogout}
                className="public-auth-btn outline"
                style={{ cursor: "pointer" }}
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="public-auth-btn outline">
                {t("nav.signin")}
              </Link>
              <Link href="/signup" className="public-auth-btn solid">
                {t("nav.signup")}
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
              aria-label={t("common.closeMenu")}
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
                <span className="public-drawer-label">{t("nav.signout")}</span>
                <LogOut className="public-drawer-arrow" size={20} />
              </button>
            )}
          </div>
          <div className="public-drawer-foot">
            <span>{t("footer.tagline")}</span>
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
          <p>{t("footer.brand.p")}</p>
          <div className="public-footer-contact">
            <span>
              <MapPin size={13} /> {t("footer.contact.locations")}
            </span>
            <a href="mailto:hello@kisansetu.in">
              <Mail size={13} /> hello@kisansetu.in
            </a>
          </div>
        </div>

        <div className="public-footer-col">
          <span className="public-footer-head">{t("footer.explore")}</span>
          <Link href="/marketplace">{t("nav.marketplace")}</Link>
          <Link href="/market-match">{t("footer.marketMatch")}</Link>
          <Link href="/dashboard">{t("footer.product")}</Link>
        </div>

        <div className="public-footer-col">
          <span className="public-footer-head">{t("footer.account")}</span>
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

        <div className="public-footer-cta">
          <span className="public-footer-head">{t("footer.getStarted")}</span>
          <p>{t("footer.cta.p")}</p>
          <Link className="public-pill" href="/market-match">
            {t("footer.cta.link")} <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="public-footer-bottom">
          <span>© {new Date().getFullYear()} {t("footer.copyright")}</span>
          <span>{t("footer.built")}</span>
        </div>
      </footer>
    </div>
  );
}
