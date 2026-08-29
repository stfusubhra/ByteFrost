/* KisanSetu Story: concise public explanation of the farmer-to-market problem and connected approach. */
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

export default function Story() {
  const { t } = useLanguage();
  return (
    <PublicLayout eyebrow={t("story.eyebrow")}>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("story.section")}</span>
          <h1>
            {t("story.h1a")} <em>{t("story.h1b")}</em>
          </h1>
          <p>{t("story.p")}</p>
        </div>
      </section>

      <div className="container">
        <section className="story-flow">
          <div>
            <span className="eyebrow">{t("story.problem.label")}</span>
            <h2>
              {t("story.problem.h2a")} {t("story.problem.h2b")}{" "}
              <em>{t("story.problem.h2c")}</em>
            </h2>
          </div>
          <div className="story-copy">
            <p>{t("story.problem.p1")}</p>
            <p>{t("story.problem.p2")}</p>
            <Link className="text-link" href="/market-match">
              {t("story.problem.link")} <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        <section className="section-tight">
          <span className="eyebrow">{t("story.approach.label")}</span>
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
      </div>
    </PublicLayout>
  );
}
