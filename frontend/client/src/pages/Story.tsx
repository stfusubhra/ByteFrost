import React from "react";
import { Link } from "wouter";
import { ArrowRight, Sprout } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

export default function Story() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      {/* Chapter 1 — The Farmer */}
      <section className="story-chapter reveal" style={{ padding: "clamp(48px,6vw,80px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="story-farmer-layout">
            <div className="story-farmer-image">
              <img
                src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80"
                alt="Indian farmer harvesting tomatoes"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <div className="story-farmer-copy">
              <span className="eyebrow">{t("story.section")}</span>
              <h1 className="story-farmer-h1">
                {t("story.h1a")} <br />
                <span className="story-farmer-h1-em">{t("story.h1b")}</span>
              </h1>
              <p className="lead">
                {t("story.p")}
              </p>
              <p className="body" style={{ marginTop: "16px" }}>
                {t("story.sub")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 2 — The Gap */}
      <section className="story-chapter reveal" style={{ padding: "clamp(48px,6vw,80px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="story-gap-visual">
            <div className="story-gap-end story-gap-farmer">
              <div className="story-gap-dot" />
              <span>FARMER</span>
            </div>
            <div className="story-gap-svg">
              <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none">
                {/* Fragmented paths between farmer and buyer */}
                <path d="M 40 80 Q 120 30 200 80 T 360 80" stroke="var(--line-strong)" fill="none" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
                <path d="M 40 80 Q 120 130 200 80 T 360 80" stroke="var(--line-strong)" fill="none" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
                {/* Gap in the middle */}
                <circle cx="200" cy="80" r="3" fill="var(--ink-muted)" opacity="0.5" />
              </svg>
            </div>
            <div className="story-gap-end story-gap-buyer">
              <span>BUYER</span>
              <div className="story-gap-dot" />
            </div>
          </div>
          <div className="story-gap-signals">
            <span>SUPPLY</span>
            <span>PRICE</span>
            <span>DEMAND</span>
            <span>LOCATION</span>
            <span>TIMING</span>
          </div>
          <div className="story-gap-text" style={{ textAlign: "center", marginTop: "32px" }}>
            <span className="eyebrow">{t("story.problem.label")}</span>
            <h2 className="story-gap-h2">
              {t("story.problem.h2a")} <br />
              {t("story.problem.h2b")} <br />
              <span className="story-gap-h2-em">{t("story.problem.h2c")}</span>
            </h2>
          </div>
        </div>
      </section>

      {/* Chapter 3 — KisanSetu Network */}
      <section className="story-chapter reveal" style={{ padding: "clamp(48px,6vw,80px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="story-network-svg-wrap">
            <svg className="story-network-svg" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
              {/* Connection lines from KisanSetu to farmers and buyers */}
              <line x1="300" y1="150" x2="80" y2="60" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
              <line x1="300" y1="150" x2="80" y2="240" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
              <line x1="300" y1="150" x2="520" y2="80" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
              <line x1="300" y1="150" x2="520" y2="150" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
              <line x1="300" y1="150" x2="520" y2="220" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />

              {/* Farmer node */}
              <circle cx="80" cy="60" r="6" fill="var(--primary)" opacity="0.8" />
              <text x="80" y="40" textAnchor="middle" fill="var(--ink)" fontSize="12" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.05em">FARMER</text>

              {/* Buyer nodes */}
              <circle cx="520" cy="80" r="5" fill="var(--ink-soft)" />
              <text x="520" y="65" textAnchor="middle" fill="var(--ink-soft)" fontSize="11" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.05em">BUYER</text>

              <circle cx="520" cy="150" r="5" fill="var(--ink-soft)" />
              <text x="520" y="135" textAnchor="middle" fill="var(--ink-soft)" fontSize="11" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.05em">BUYER</text>

              <circle cx="520" cy="220" r="5" fill="var(--ink-soft)" />
              <text x="520" y="205" textAnchor="middle" fill="var(--ink-soft)" fontSize="11" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.05em">BUYER</text>

              {/* Second farmer */}
              <circle cx="80" cy="240" r="6" fill="var(--primary)" opacity="0.8" />
              <text x="80" y="270" textAnchor="middle" fill="var(--ink)" fontSize="12" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.05em">FARMER</text>

              {/* KisanSetu center */}
              <circle cx="300" cy="150" r="12" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.5" />
              <text x="300" y="154" textAnchor="middle" fill="var(--primary)" fontSize="10" fontFamily="var(--font-display)" fontWeight="400">KS</text>
              <text x="300" y="190" textAnchor="middle" fill="var(--ink)" fontSize="11" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.08em" textTransform="uppercase">KISANSETU</text>
            </svg>
          </div>
          <div className="story-network-text" style={{ textAlign: "center", marginTop: "32px" }}>
            <span className="eyebrow">{t("story.sec2.eyebrow")}</span>
            <h2 className="story-network-h2">{t("story.sec2.h2")}</h2>
            <p className="lead" style={{ maxWidth: "640px", margin: "16px auto 0" }}>
              {t("story.sec2.p")}
            </p>
          </div>
        </div>
      </section>

      {/* Chapter 4 — Intelligence */}
      <section className="story-chapter reveal" style={{ padding: "clamp(48px,6vw,80px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="story-intelligence-card">
            <div className="story-intelligence-header">
              <div className="story-intelligence-crop">
                <span className="story-intelligence-crop-name">Tomatoes</span>
                <span className="story-intelligence-crop-qty">500 kg</span>
              </div>
              <div className="story-intelligence-badge">{t("home.preview.badge")}</div>
            </div>
            <div className="story-intelligence-body">
              <div className="story-intelligence-row">
                <span className="story-intelligence-label">DEMAND</span>
                <span className="story-intelligence-value">{t("home.preview.demand")}</span>
              </div>
              <div className="story-intelligence-row">
                <span className="story-intelligence-label">PRICE</span>
                <span className="story-intelligence-value">
                  {t("home.preview.priceLabel")}: <strong>₹32/kg</strong>
                </span>
              </div>
              <div className="story-intelligence-row">
                <span className="story-intelligence-label">MATCH</span>
                <span className="story-intelligence-value">
                  <strong>{t("home.preview.match")}</strong> · {t("home.preview.matchSub")}
                </span>
              </div>
            </div>
            <div className="story-intelligence-footer">
              <span className="story-intelligence-note">
                {t("story.problem.p2")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 5 — Movement */}
      <section className="story-chapter reveal" style={{ padding: "clamp(48px,6vw,80px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="story-route-visual">
            <div className="story-route-nodes">
              <div className="story-route-node">
                <div className="story-route-dot" />
                <span>Farmer A</span>
              </div>
              <div className="story-route-node">
                <div className="story-route-dot" />
                <span>Farmer B</span>
              </div>
              <div className="story-route-node">
                <div className="story-route-dot" />
                <span>Farmer C</span>
              </div>
            </div>
            <div className="story-route-path">
              <svg width="100%" height="40" viewBox="0 0 200 40" preserveAspectRatio="none">
                <path d="M 10 20 L 190 20" stroke="var(--primary)" fill="none" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="10" cy="20" r="3" fill="var(--primary)" />
                <circle cx="190" cy="20" r="3" fill="var(--primary)" />
                <polygon points="183,16 190,20 183,24" fill="var(--primary)" />
              </svg>
            </div>
            <div className="story-route-buyer">
              <span>BUYER</span>
              <div className="story-route-dot" />
            </div>
          </div>
          <div className="story-route-text" style={{ textAlign: "center", marginTop: "32px" }}>
            <span className="eyebrow">{t("story.sec4.eyebrow")}</span>
            <h2 className="story-route-h2">{t("story.sec4.h2")}</h2>
            <p className="lead" style={{ maxWidth: "640px", margin: "16px auto 0" }}>
              {t("story.sec4.p")}
            </p>
          </div>
        </div>
      </section>

      {/* Ending */}
      <section className="story-ending reveal" style={{ padding: "clamp(64px,8vw,96px) 0" }}>
        <div className="container">
          <div className="story-ending-inner">
            <span className="eyebrow">{t("story.section")}</span>
            <h2 className="story-ending-h2">
              {t("story.sec8.h2")}
            </h2>
            <p className="lead" style={{ maxWidth: "560px", margin: "16px auto 24px" }}>
              {t("story.sec8.p")}
            </p>
            <div className="story-ending-cta">
              <Link className="btn btn-primary btn-lg" href="/marketplace">
                {t("home.hero.cta1")} <ArrowRight size={16} />
              </Link>
              <Link className="btn btn-secondary btn-lg" href="/signup">
                {t("home.hero.cta2")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}