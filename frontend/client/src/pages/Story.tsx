/* KisanSetu Story: concise public explanation of the farmer-to-market problem and connected approach. */
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

export default function Story() {
  const { t } = useLanguage();
  return (
    <PublicLayout eyebrow={t("story.eyebrow")}>
      <section className="public-hero story-hero">
        <span>{t("story.section")}</span>
        <h1>
          {t("story.h1a")}
          <br />
          <em>{t("story.h1b")}</em>
        </h1>
        <p>{t("story.p")}</p>
      </section>

      <section className="story-flow public-reveal">
        <div>
          <span>{t("story.problem.label")}</span>
          <h2>
            {t("story.problem.h2a")}
            <br />
            {t("story.problem.h2b")}
            <br />
            <em>{t("story.problem.h2c")}</em>
          </h2>
        </div>
        <div className="story-copy">
          <p>{t("story.problem.p1")}</p>
          <p>{t("story.problem.p2")}</p>
          <a className="public-text-link" href="/market-match">
            {t("story.problem.link")}
          </a>
        </div>
      </section>

      <section className="story-steps public-reveal">
        <span>{t("story.approach.label")}</span>
        <div>
          <article>
            <b>01</b>
            <h3>{t("story.step1.title")}</h3>
            <p>{t("story.step1.p")}</p>
          </article>
          <article>
            <b>02</b>
            <h3>{t("story.step2.title")}</h3>
            <p>{t("story.step2.p")}</p>
          </article>
          <article>
            <b>03</b>
            <h3>{t("story.step3.title")}</h3>
            <p>{t("story.step3.p")}</p>
          </article>
        </div>
      </section>
    </PublicLayout>
  );
}
