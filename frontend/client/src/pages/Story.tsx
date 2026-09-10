import { Link } from "wouter";
import { ArrowRight, Sprout, Box, CheckCircle } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

export default function Story() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      {/* 1. HERO */}
      <section
        className="story-hero"
        style={{
          padding: "clamp(48px, 7vw, 96px) 0 clamp(40px, 5vw, 56px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="story-hero-grid">
          <div className="story-hero-copy">
            <span className="eyebrow">{t("story.section")}</span>
            <h1 className="story-hero-h1">
              {t("story.h1a")} <em className="story-hero-h1-em">{t("story.h1b")}</em>
            </h1>
            <p className="story-hero-lead">
              {
                "KisanSetu connects farmers directly with buyers and coordinates smarter logistics to move every order efficiently."
              }
            </p>
            <div className="story-hero-cta">
              <Link className="btn btn-primary" href="/marketplace">
                {t("story.exploreMarketplace")} <ArrowRight size={15} />
              </Link>
              <Link className="btn btn-secondary" href="/market-match">
                {t("story.findMatch")}
              </Link>
            </div>
          </div>
          <div className="story-hero-media">
            <img
              src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1600&q=80"
              alt="Indian farmland at harvest time — tomato fields and rural market road"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* 2. PROBLEM + SOLUTION (combined) */}
      <section
        className="story-connect"
        style={{
          padding: "clamp(40px, 5vw, 64px) 0",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="container">
          <div className="story-connect-grid">
            <div className="story-connect-left">
              <h2 className="story-connect-h2">
                {
                  "Farmers shouldn't have to travel through layers of middlemen to reach the market."
                }
              </h2>
            </div>
            <div className="story-connect-right">
              <p className="story-connect-desc">
                {
                  "Traditional supply chains create distance between the people who grow food and the people who buy it. KisanSetu creates a direct connection and coordinates the movement between them."
                }
              </p>
            </div>
          </div>

          <div className="story-flow" aria-hidden="true">
            <div className="story-flow-node">
              <Sprout size={18} className="story-flow-icon" />
              <span className="story-flow-label">Farmer</span>
            </div>
            <div className="story-flow-bridge">
              <span className="story-flow-bridge-text">────────</span>
            </div>
            <div className="story-flow-hub">
              <span className="story-flow-hub-label">KisanSetu</span>
            </div>
            <div className="story-flow-bridge">
              <span className="story-flow-bridge-text">────────</span>
            </div>
            <div className="story-flow-node">
              <span className="story-flow-icon">🏪</span>
              <span className="story-flow-label">Buyer</span>
            </div>
          </div>

          <p className="story-flow-caption">
            {
              "Direct connection. Smarter movement. Better value."
            }
          </p>
        </div>
      </section>

      {/* 3. HOW KISANSETU WORKS (compressed diagram) */}
      <section
        className="story-how"
        style={{
          padding: "clamp(40px, 5vw, 64px) 0",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="container">
          <div className="story-how-head">
            <span className="eyebrow">{t("story.section")}</span>
            <h2 className="story-how-h2">
              {
                "When supply meets demand, the distance gets smarter."
              }
            </h2>
          </div>

          <div className="story-how-flow" role="img" aria-label="Supply aggregation diagram">
            <div className="story-how-farm">
              <div className="story-farm-num">01</div>
              <div className="story-farm-meta">
                <div className="story-farm-qty">400 kg</div>
                <div className="story-farm-sub">Tomatoes · Nashik</div>
              </div>
              <span className="story-how-dot" aria-hidden="true" />
            </div>

            <div className="story-how-farm">
              <div className="story-farm-num">02</div>
              <div className="story-farm-meta">
                <div className="story-farm-qty">300 kg</div>
                <div className="story-farm-sub">Tomatoes · Pune</div>
              </div>
              <span className="story-how-dot" aria-hidden="true" />
            </div>

            <div className="story-how-farm">
              <div className="story-farm-num">03</div>
              <div className="story-farm-meta">
                <div className="story-farm-qty">300 kg</div>
                <div className="story-farm-sub">Tomatoes · Satara</div>
              </div>
            </div>

            <div className="story-how-collect">
              <div className="story-collect-line" aria-hidden="true" />
              <div className="story-collect-box">
                <div className="story-collect-num">1,000 kg</div>
                <div className="story-collect-label">consolidated supply</div>
              </div>
              <div className="story-collect-line" aria-hidden="true" />
            </div>

            <div className="story-how-buyer">
              <div className="story-buyer-line" aria-hidden="true" />
              <div className="story-buyer-label">Buyer</div>
              <div className="story-buyer-sub">one shipment, one route</div>
            </div>
          </div>

          <p className="story-how-caption">
            {
              "KisanSetu combines nearby supply when it makes the journey more efficient."
            }
          </p>
        </div>
      </section>

      {/* 4. HUMAN IMPACT */}
      <section
        className="story-impact"
        style={{
          padding: "clamp(40px, 5vw, 64px) 0",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="story-impact-grid">
          <div className="story-impact-media">
            <img
              src="/images/story-impact.webp"
              alt="Harvested produce at a local Indian agricultural market"
              loading="lazy"
            />
          </div>
          <div className="story-impact-copy">
            <span className="story-impact-eyebrow">{t("story.section")}</span>
            <h2 className="story-impact-h2">
              {
                "More of the value should reach the people who grow the food."
              }
            </h2>
            <p className="story-impact-lead">
              {
                "By connecting farmers with verified buyers and coordinating efficient movement, KisanSetu aims to reduce unnecessary distance between harvest and market."
              }
            </p>

            <div className="story-impact-stats" aria-label="Illustrative model comparison">
              <div className="story-impact-stat">
                <div className="story-impact-stat-num">38%</div>
                <div className="story-impact-stat-label">value retained · traditional chains</div>
              </div>
              <div className="story-impact-stat-divider" aria-hidden="true" />
              <div className="story-impact-stat">
                <div className="story-impact-stat-num story-impact-stat-primary">~82%</div>
                <div className="story-impact-stat-label">value retained · KisanSetu direct</div>
              </div>
              <p className="story-impact-note">
                Illustrative comparison based on typical chain margins, not measured outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA */}
      <section
        className="story-cta"
        style={{
          padding: "clamp(48px, 6vw, 64px) 0",
          minHeight: "clamp(34vh, 380px, 40vh)",
        }}
      >
        <div className="container">
          <div className="story-cta-inner">
            <span className="story-cta-eyebrow">{t("story.section")}</span>
            <h2 className="story-cta-h2">
              {
                "From farm to market, connected."
              }
            </h2>
            <p className="story-cta-lead">
              {
                "A simpler way for farmers and buyers to meet."
              }
            </p>
            <div className="story-cta-cta">
              <Link className="btn btn-primary" href="/marketplace">
                Explore KisanSetu <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
