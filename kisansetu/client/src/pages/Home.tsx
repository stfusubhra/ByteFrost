/* KisanSetu Premium landing: 3D layered hero with cursor-following spotlight, live interactive imagery, smooth scroll, masked line reveals, and micro-interactions. */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Menu, Search, Sprout, X } from "lucide-react";

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

  useEffect(() => {
    const t = localStorage.getItem("kisansetu_token");
    setToken(t);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("kisansetu_token");
    window.location.href = "/";
  };

  return (
    <>
      <div className="prem-announce">Direct market intelligence for everyday farming</div>
      <header className="prem-header">
        <button onClick={onMenu} aria-label="Open menu" className="prem-menu-btn">
          <Menu size={18} /> <span>Menu</span>
        </button>
        <Link href="/" className="prem-wordmark">
          <span><Sprout size={15} /></span>KisanSetu
        </Link>
        <div className="prem-actions">
          <button aria-label="Search"><Search size={17} /></button>
          <Link href="/marketplace">Marketplace</Link>
          {token ? (
            <>
              <span className="prem-user">Welcome</span>
              <button onClick={handleLogout} className="prem-auth-btn outline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="prem-auth-btn outline">Sign in</Link>
              <Link href="/signup" className="prem-auth-btn solid">Sign up</Link>
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
  useReveal();

  return (
    <div className="premium-landing" id="top">
      <div className="prem-scrollbar" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <Header onMenu={() => setMenu(true)} />
      {menu && (
        <div className="prem-menu">
          <button onClick={() => setMenu(false)} aria-label="Close menu"><X size={21} /></button>
          <Link href="/" onClick={() => setMenu(false)}>Home</Link>
          <Link href="/marketplace" onClick={() => setMenu(false)}>Marketplace</Link>
          <Link href="/market-match" onClick={() => setMenu(false)}>Find your market match</Link>
          <Link href="/story" onClick={() => setMenu(false)}>Our story</Link>
          <Link href="/faq" onClick={() => setMenu(false)}>FAQ</Link>
          <Link href="/contact" onClick={() => setMenu(false)}>Contact</Link>
          <Link href="/login" onClick={() => setMenu(false)}>Sign in</Link>
          <Link href="/signup" onClick={() => setMenu(false)} style={{ color: "#d59a39" }}>Create free account →</Link>
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
              <span className="prem-eyebrow">From farm to market</span>
              <h1>
                <span className="prem-line"><span>A clearer market</span></span>
                <span className="prem-line"><span>for every harvest.</span></span>
              </h1>
              <p>KisanSetu connects farmers, buyers, and logistics in one calmer way to move produce.</p>
              <div className="prem-hero-cta">
                <Link className="prem-pill" href="/marketplace">Explore the marketplace <ArrowRight size={14} /></Link>
                <Link className="prem-pill ghost" href="/market-match">Find your market match</Link>
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
              <div className="prem-float prem-float-1"><strong>₹2,400</strong><small>tomato / quintal</small></div>
              <div className="prem-float prem-float-2"><strong>28 km</strong><small>to nearest buyer</small></div>
            </div>
          </div>

          <div className="prem-hero-foot">
            <span>Scroll to explore</span>
            <span className="prem-scroll-line"><i /></span>
            <span>KisanSetu · 2026</span>
          </div>
        </section>

        {/* INTRO — masked line reveal */}
        <section className="prem-intro prem-reveal" id="story">
          <div className="prem-section-label">01 / OUR APPROACH</div>
          <div className="prem-intro-copy">
            <h2>
              <span className="prem-line"><span>Less distance</span></span>
              <span className="prem-line"><span>between harvest</span></span>
              <span className="prem-line"><span>and home.</span></span>
            </h2>
            <div>
              <p>Every harvest begins with a farmer. The right buyer should not feel like another long journey.</p>
              <Link className="prem-link" href="/story">Our story <ArrowRight size={14} /></Link>
            </div>
          </div>
        </section>

        {/* COLLECTION — live interactive images */}
        <section className="prem-collection prem-reveal" id="marketplace">
          <div className="prem-collection-head">
            <div>
              <span>02 / FARMER FAVORITES</span>
              <h2>Ready to move.</h2>
            </div>
            <div>
              <p>Produce with a buyer in view, not waiting in the dark.</p>
              <Link className="prem-link" href="/marketplace">Shop all produce <ArrowRight size={14} /></Link>
            </div>
          </div>
          <div className="prem-product-grid">
            <Link href="/marketplace" className="prem-product">
              <div className="prem-product-image"><img src={img.tomatoes} alt="Fresh tomatoes ready for market" /></div>
              <div><strong>Freshly harvested</strong><span>Tomatoes · Grade A</span></div>
            </Link>
            <Link href="/marketplace" className="prem-product">
              <div className="prem-product-image"><img src={img.crates} alt="Harvest crates ready to move" /></div>
              <div><strong>Ready to route</strong><span>500 kg · Matched supply</span></div>
            </Link>
          </div>
        </section>

        {/* FEATURE — parallax image */}
        <section className="prem-feature prem-reveal">
          <div className="prem-feature-image"><img src={img.market} alt="Produce waiting at a market" /></div>
          <div className="prem-feature-copy">
            <span>03 / NEW CONNECTIONS</span>
            <h2>
              <span className="prem-line"><span>Supply exists.</span></span>
              <span className="prem-line"><span>Demand exists.</span></span>
              <span className="prem-line"><span><em>They should meet.</em></span></span>
            </h2>
            <p>KisanSetu brings the market into view: demand, price, buyer, location, and timing in one connected flow.</p>
            <Link className="prem-link" href="/market-match">See how it works <ArrowRight size={14} /></Link>
          </div>
        </section>

        {/* MATCH — count-up stats */}
        <section className="prem-match prem-reveal" id="match">
          <div className="prem-section-label">04 / FIND YOUR MARKET MATCH</div>
          <div className="prem-match-copy">
            <h2>
              <span className="prem-line"><span>The right market</span></span>
              <span className="prem-line"><span>is closer than it feels.</span></span>
            </h2>
            <p>Answer a few simple questions. Get a clearer next move for what you grow.</p>
            <Link className="prem-pill" href="/market-match">Find my market match <ArrowRight size={14} /></Link>
          </div>
          <div className="prem-match-stats">
            <Stat value={92} suffix="%" label="buyer match" />
            <Stat value={28} suffix=" km" label="efficient route" />
            <Stat value={700} suffix=" kg" label="demo load" />
          </div>
        </section>

        {/* CLOSING — parallax landscape */}
        <section className="prem-closing prem-reveal">
          <div>
            <span>KISANSETU</span>
            <h2>
              <span className="prem-line"><span>From farm to market,</span></span>
              <span className="prem-line"><span><em>directly.</em></span></span>
            </h2>
            <Link className="prem-link" href="/dashboard">Get started <ArrowRight size={14} /></Link>
          </div>
          <div className="prem-closing-image"><img src={img.landscape} alt="Vast farm landscape at sunset" /></div>
        </section>
      </main>

      <footer className="prem-footer">
        <Link href="/" className="prem-wordmark"><span><Sprout size={14} /></span>KisanSetu</Link>
        <span>Market, made clearer.</span>
        <div>
          <Link href="/story">About</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
