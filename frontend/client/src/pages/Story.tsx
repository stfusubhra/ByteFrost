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
            <div className="story-gap-node story-gap-node-farmer">
              <div className="story-gap-node-dot" />
              <span>FARMER</span>
            </div>
            <div className="story-gap-node story-gap-node-buyer">
              <span>BUYER</span>
              <div className="story-gap-node-dot" />
            </div>
            <div className="story-gap-lines">
              <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
                <path d="M 20 100 Q 100 60 200 100 T 380 100" stroke="var(--line-strong)" fill="none" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M 20 100 Q 100 140 200 100 T 380 100" stroke="var(--line-strong)" fill="none" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="200" cy="100" r="4" fill="var(--ink-muted)" />
              </svg>
            </div>
            <div className="story-gap-signals">
              <span className="story-gap-signal">SUPPLY</span>
              <span className="story-gap-signal">PRICE</span>
              <span className="story-gap-signal">DEMAND</span>
              <span className="story-gap-signal">LOCATION</span>
              <span className="story-gap-signal">TIMING</span>
            </div>
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

      {/* Chapter 3 — KisanSetu */}
      <section className="story-chapter reveal" style={{ padding: "clamp(48px,6vw,80px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="story-network-visual">
            <div className="story-network-farmer">
              <div className="story-network-dot" />
              <span>FARMER</span>
            </div>
            <div className="story-network-center">
              <div className="story-network-logo">
                <Sprout size={24} color="var(--primary)" />
                <span>KisanSetu</span>
              </div>
              <div className="story-network-nodes">
                <div className="story-network-node story-network-node-1">
                  <div className="story-network-dot" />
                  <span>BUYER</span>
                </div>
                <div className="story-network-node story-network-node-2">
                  <div className="story-network-dot" />
                  <span>BUYER</span>
                </div>
                <div className="story-network-node story-network-node-3">
                  <div className="story-network-dot" />
                  <span>BUYER</span>
                </div>
              </div>
            </div>
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
          <div className="story-intelligence-layout">
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
              <svg width="100%" height="60" viewBox="0 0 300 60" preserveAspectRatio="none">
                <path d="M 30 30 L 270 30" stroke="var(--primary)" fill="none" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="30" cy="30" r="3" fill="var(--primary)" />
                <circle cx="270" cy="30" r="3" fill="var(--primary)" />
                <polygon points="260,25 270,30 260,35" fill="var(--primary)" />
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