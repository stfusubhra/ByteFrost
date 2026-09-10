/* KisanSetu About: short editorial page — what we do, why, and how to reach us. */
import React from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      <main>
        <section className="page-hero">
          <div className="container">
            <span className="eyebrow">{t("about.eyebrow")}</span>
            <h1>{t("about.h1")}</h1>
          </div>
        </section>

        <section className="container section">
          <div className="about-grid">
            <div className="about-copy">
              <p className="lead">{t("about.p1")}</p>
              <p className="body">{t("about.p2")}</p>
            </div>
            <div className="about-side">
              <span className="eyebrow">{t("about.mission")}</span>
              <p className="about-mission">{t("about.mission.p")}</p>
            </div>
          </div>
        </section>

        <section className="container section-tight">
          <div className="about-contact">
            <div>
              <span className="eyebrow">{t("about.contact")}</span>
              <p className="body">{t("about.contact.p")}</p>
            </div>
            <div className="about-contact-actions">
              <a className="btn btn-primary" href="mailto:hello@kisansetu.in">
                hello@kisansetu.in
              </a>
              <Link className="btn btn-secondary" href="/marketplace">
                {t("story.exploreMarketplace")} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}