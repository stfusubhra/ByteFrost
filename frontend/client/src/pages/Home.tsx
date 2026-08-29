/* KisanSetu Premium landing: 3D layered hero with cursor-following spotlight, live interactive imagery, smooth scroll, masked line reveals, and micro-interactions. */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Menu, Search, Sprout, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

const img = {
  hero: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=80",
  tomatoes: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=1200&q=80",
  market: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&q=80",
  farmer: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1200&q=80",
  landscape: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80",
  crates: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200&q=80",
};

function Header({ onMenu }: { onMenu: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const stored = localStorage.getItem("kisansetu_token");
    setToken(stored);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("kisansetu_token");
    window.location.href = "/";
  };

  return (
    <>
      <div className="prem-announce">{t("announce.default")}</div>
      <header className="prem-header">
        <button onClick={onMenu} aria-label={t("common.openMenu")} className="prem-menu-btn">
          <Menu size={18} /> <span>{t("common.openMenu")}</span>
        </button>
        <Link href="/" className="prem-wordmark">
          <span><Sprout size={15} /></span>KisanSetu
        </Link>
        <div className="prem-actions">
          <button aria-label="Search"><Search size={17} /></button>
          <Link href="/marketplace">{t("nav.marketplace")}</Link>
          <LanguageSelector variant="light" />
          {token ? (
            <>
              <span className="prem-user">{t("nav.welcome")}</span>
              <button onClick={handleLogout} className="prem-auth-btn outline">
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="prem-auth-btn outline">{t("nav.signin")}</Link>
              <Link href="/signup" className="prem-auth-btn solid">{t("nav.signup")}</Link>
            </>
          )}
        </div>
      </header>
    </>
  );
}

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
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, []);
  return progress;
}

/* Cursor-following spotlight + 3D tilt on the hero image (Farm Minerals style). */
function useHeroSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty("--cursor-x", `${x}%`);
        el.style.setProperty("--cursor-y", `${y}%`);
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
        el.style.setProperty("--tilt-x", `${rx}deg`);
        el.style.setProperty("--tilt-y", `${ry}deg`);
      });
    };
    const onLeave = () => {
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, []);
  return ref;
}

/* Count-up stats when scrolled into view. */
function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting)),
      { threshold: 0.16, rootMargin: "0px 0px -12% 0px" }
    );
    document.querySelectorAll(".prem-reveal").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } }, { threshold: 0.5 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  const n = useCountUp(value, active);
  return <span ref={ref}><strong>{n}{suffix}</strong><small>{label}</small></span>;
}

export default function Home() {
  const [menu, setMenu] = useState(false);
  const progress = useScrollProgress();
  const spotlight = useHeroSpotlight();
  const { t } = useLanguage();
  useReveal();

  return (
    <div className="premium-landing" id="top">
      <div className="prem-scrollbar" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <Header onMenu={() => setMenu(true)} />
      {menu && (
        <div className="prem-menu">
          <button onClick={() => setMenu(false)} aria-label={t("common.closeMenu")}><X size={21} /></button>
          <Link href="/" onClick={() => setMenu(false)}>{t("home.menu.home")}</Link>
          <Link href="/marketplace" onClick={() => setMenu(false)}>{t("home.menu.marketplace")}</Link>
          <Link href="/market-match" onClick={() => setMenu(false)}>{t("home.menu.findmatch")}</Link>
          <Link href="/story" onClick={() => setMenu(false)}>{t("home.menu.story")}</Link>
          <Link href="/faq" onClick={() => setMenu(false)}>{t("home.menu.faq")}</Link>
          <Link href="/contact" onClick={() => setMenu(false)}>{t("home.menu.contact")}</Link>
          <Link href="/login" onClick={() => setMenu(false)}>{t("home.menu.signin")}</Link>
          <Link href="/signup" onClick={() => setMenu(false)} style={{ color: "#d59a39" }}>{t("home.menu.createAccount")}</Link>
        </div>
      )}

      <main>
        {/* HERO — 3D layered with cursor spotlight */}
        <section className="prem-hero">
          <div className="prem-hero-bg" aria-hidden="true">
            <span className="prem-orb prem-orb-1" />
            <span className="prem-orb prem-orb-2" />
            <span className="prem-grid" />
          </div>

          <div className="prem-hero-inner">
            <div className="prem-hero-copy">
              <span className="prem-eyebrow">{t("home.hero.eyebrow")}</span>
              <h1>
                <span className="prem-line"><span>{t("home.hero.h1a")}</span></span>
                <span className="prem-line"><span>{t("home.hero.h1b")}</span></span>
              </h1>
              <p>{t("home.hero.p")}</p>
              <div className="prem-hero-cta">
                <Link className="prem-pill" href="/marketplace">{t("home.hero.cta1")} <ArrowRight size={14} /></Link>
                <Link className="prem-pill ghost" href="/market-match">{t("home.hero.cta2")}</Link>
              </div>
            </div>

            <div className="prem-hero-media" ref={spotlight}>
              <div className="prem-tilt">
                <img
                  src={img.hero}
                  alt="Farmer working in a lush green field at golden hour"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="prem-spotlight" aria-hidden="true" />
                <div className="prem-shade" aria-hidden="true" />
              </div>
              <div className="prem-float prem-float-1"><strong>₹2,400</strong><small>{t("home.hero.float1.label")}</small></div>
              <div className="prem-float prem-float-2"><strong>28 km</strong><small>{t("home.hero.float2.label")}</small></div>
            </div>
          </div>

          <div className="prem-hero-foot">
            <span>{t("home.hero.foot.scroll")}</span>
            <span className="prem-scroll-line"><i /></span>
            <span>{t("home.hero.foot.year")}</span>
          </div>
        </section>

        {/* INTRO — masked line reveal */}
        <section className="prem-intro prem-reveal" id="story">
          <div className="prem-section-label">{t("home.intro.label")}</div>
          <div className="prem-intro-copy">
            <h2>
              <span className="prem-line"><span>{t("home.intro.h2a")}</span></span>
              <span className="prem-line"><span>{t("home.intro.h2b")}</span></span>
              <span className="prem-line"><span>{t("home.intro.h2c")}</span></span>
            </h2>
            <div>
              <p>{t("home.intro.p")}</p>
              <Link className="prem-link" href="/story">{t("home.intro.link")} <ArrowRight size={14} /></Link>
            </div>
          </div>
        </section>

        {/* COLLECTION — live interactive images */}
        <section className="prem-collection prem-reveal" id="marketplace">
          <div className="prem-collection-head">
            <div>
              <span>{t("home.collection.label")}</span>
              <h2>{t("home.collection.h2")}</h2>
            </div>
            <div>
              <p>{t("home.collection.p")}</p>
              <Link className="prem-link" href="/marketplace">{t("home.collection.link")} <ArrowRight size={14} /></Link>
            </div>
          </div>
          <div className="prem-product-grid">
            <Link href="/marketplace" className="prem-product">
              <div className="prem-product-image"><img src={img.tomatoes} alt="Fresh tomatoes ready for market" /></div>
              <div><strong>{t("home.collection.p1.title")}</strong><span>{t("home.collection.p1.sub")}</span></div>
            </Link>
            <Link href="/marketplace" className="prem-product">
              <div className="prem-product-image"><img src={img.crates} alt="Harvest crates ready to move" /></div>
              <div><strong>{t("home.collection.p2.title")}</strong><span>{t("home.collection.p2.sub")}</span></div>
            </Link>
          </div>
        </section>

        {/* FEATURE — parallax image */}
        <section className="prem-feature prem-reveal">
          <div className="prem-feature-image"><img src={img.market} alt="Produce waiting at a market" /></div>
          <div className="prem-feature-copy">
            <span>{t("home.feature.label")}</span>
            <h2>
              <span className="prem-line"><span>{t("home.feature.h2a")}</span></span>
              <span className="prem-line"><span>{t("home.feature.h2b")}</span></span>
              <span className="prem-line"><span><em>{t("home.feature.h2c")}</em></span></span>
            </h2>
            <p>{t("home.feature.p")}</p>
            <Link className="prem-link" href="/market-match">{t("home.feature.link")} <ArrowRight size={14} /></Link>
          </div>
        </section>

        {/* MATCH — count-up stats */}
        <section className="prem-match prem-reveal" id="match">
          <div className="prem-section-label">{t("home.match.label")}</div>
          <div className="prem-match-copy">
            <h2>
              <span className="prem-line"><span>{t("home.match.h2a")}</span></span>
              <span className="prem-line"><span>{t("home.match.h2b")}</span></span>
            </h2>
            <p>{t("home.match.p")}</p>
            <Link className="prem-pill" href="/market-match">{t("home.match.cta")} <ArrowRight size={14} /></Link>
          </div>
          <div className="prem-match-stats">
            <Stat value={92} suffix="%" label={t("home.match.stat1.label")} />
            <Stat value={28} suffix=" km" label={t("home.match.stat2.label")} />
            <Stat value={700} suffix=" kg" label={t("home.match.stat3.label")} />
          </div>
        </section>

        {/* CLOSING — parallax landscape */}
        <section className="prem-closing prem-reveal">
          <div>
            <span>{t("home.closing.label")}</span>
            <h2>
              <span className="prem-line"><span>{t("home.closing.h2a")}</span></span>
              <span className="prem-line"><span><em>{t("home.closing.h2b")}</em></span></span>
            </h2>
            <Link className="prem-link" href="/dashboard">{t("home.closing.link")} <ArrowRight size={14} /></Link>
          </div>
          <div className="prem-closing-image"><img src={img.landscape} alt="Vast farm landscape at sunset" /></div>
        </section>
      </main>

      <footer className="prem-footer">
        <Link href="/" className="prem-wordmark"><span><Sprout size={14} /></span>KisanSetu</Link>
        <span>{t("footer.tagline")}</span>
        <div>
          <Link href="/story">{t("footer.about")}</Link>
          <Link href="/faq">{t("nav.faq")}</Link>
          <Link href="/contact">{t("nav.contact")}</Link>
        </div>
      </footer>
    </div>
  );
}
