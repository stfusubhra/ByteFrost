/* KisanSetu landing: a concise scroll-story from farmer to market. Uses the shared public shell (header/footer) and the unified design system. */
import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

const img = {
  hero: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=80",
  tomatoes: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=1200&q=80",
  market: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&q=80",
  farmer: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1200&q=80",
  landscape: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80",
  crates: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200&q=80",
};

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) =>
          entry.target.classList.toggle("is-visible", entry.isIntersecting)
        ),
      { threshold: 0.16, rootMargin: "0px 0px -12% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export default function Home() {
  const { t } = useLanguage();
  useReveal();

  return (
    <PublicLayout eyebrow={t("announce.default")}>
    <main>
      {/* HERO */}
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <span className="eyebrow">{t("home.hero.eyebrow")}</span>
            <h1>
              {t("home.hero.h1a")} <em>{t("home.hero.h1b")}</em>
            </h1>
            <p>{t("home.hero.p")}</p>
            <div className="home-hero-cta">
              <Link className="btn btn-primary btn-lg" href="/marketplace">
                {t("home.hero.cta1")} <ArrowRight size={16} />
              </Link>
              <Link className="btn btn-secondary btn-lg" href="/market-match">
                {t("home.hero.cta2")}
              </Link>
            </div>
          </div>
          <div className="home-hero-media">
            <img
              src={img.hero}
              alt="Farmer working in a lush green field at golden hour"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* STORY — the gap KisanSetu closes */}
      <section className="home-story">
        <div className="container section">
          <div className="home-story-grid">
            <div>
              <span className="eyebrow">{t("home.feature.label")}</span>
              <h2>
                {t("home.feature.h2a")} {t("home.feature.h2b")}{" "}
                <em>{t("home.feature.h2c")}</em>
              </h2>
            </div>
            <div className="home-story-copy">
              <p>{t("home.feature.p")}</p>
              <p>{t("home.intro.p")}</p>
              <Link className="text-link" href="/story">
                {t("home.intro.link")} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE — supply chain */}
      <section className="container">
        <div className="feature-row reveal">
          <div className="feature-media">
            <img src={img.tomatoes} alt="Fresh tomatoes ready for market" loading="lazy" />
          </div>
          <div className="feature-copy">
            <span className="eyebrow">{t("home.collection.label")}</span>
            <h2>{t("home.collection.h2")}</h2>
            <p>{t("home.collection.p")}</p>
            <Link className="text-link" href="/marketplace">
              {t("home.collection.link")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="feature-row reverse reveal">
          <div className="feature-media">
            <img src={img.market} alt="Produce waiting at a market" loading="lazy" />
          </div>
          <div className="feature-copy">
            <span className="eyebrow">{t("home.match.label")}</span>
            <h2>
              {t("home.match.h2a")} <em>{t("home.match.h2b")}</em>
            </h2>
            <p>{t("home.match.p")}</p>
            <Link className="text-link" href="/market-match">
              {t("home.match.cta")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="feature-row reveal">
          <div className="feature-media">
            <img src={img.crates} alt="Harvest crates ready to move" loading="lazy" />
          </div>
          <div className="feature-copy">
            <span className="eyebrow">{t("home.intro.label")}</span>
            <h2>
              {t("home.intro.h2a")} {t("home.intro.h2b")}{" "}
              <em>{t("home.intro.h2c")}</em>
            </h2>
            <p>{t("home.hero.p")}</p>
            <Link className="text-link" href="/dashboard">
              {t("footer.product")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* STEPS — how it works */}
      <section className="container section-tight reveal">
        <span className="eyebrow">{t("home.collection.label")}</span>
        <div className="steps" style={{ marginTop: 28 }}>
          <div className="step">
            <b>01</b>
            <h3>{t("story.step1.title")}</h3>
            <p>{t("story.step1.p")}</p>
          </div>
          <div className="step">
            <b>02</b>
            <h3>{t("story.step2.title")}</h3>
            <p>{t("story.step2.p")}</p>
          </div>
          <div className="step">
            <b>03</b>
            <h3>{t("story.step3.title")}</h3>
            <p>{t("story.step3.p")}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="container">
          <h2>
            {t("home.closing.h2a")} <em>{t("home.closing.h2b")}</em>
          </h2>
          <p>{t("footer.cta.p")}</p>
          <Link className="btn btn-primary btn-lg" href="/market-match">
            {t("home.match.cta")} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
    </PublicLayout>
  );
}
