/* KisanSetu Dashboard entry: public transition page; existing application/dashboard stays untouched. */
import { Link } from "wouter";
import { ArrowRight, BarChart3, MapPin, Users } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DashboardEntry() {
  const { t } = useLanguage();

  return (
    <PublicLayout eyebrow={t("entry.eyebrow")}>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("footer.product")}</span>
          <h1>{t("entry.h1")}</h1>
          <p>
            {t("entry.p")}
          </p>
          <div style={{ marginTop: 28 }}>
            <Link className="btn btn-primary" href="/">
              {t("entry.openExp")} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="entry-grid">
          <article className="card entry-card">
            <BarChart3 size={20} />
            <span>{t("entry.demandTitle")}</span>
            <h2>{t("entry.demandH2")}</h2>
            <p className="entry-card-p">
              {t("entry.demandP")}
            </p>
          </article>
          <article className="card entry-card">
            <Users size={20} />
            <span>{t("entry.matchingTitle")}</span>
            <h2>{t("entry.matchingH2")}</h2>
            <p className="entry-card-p">
              {t("entry.matchingP")}
            </p>
          </article>
          <article className="card entry-card">
            <MapPin size={20} />
            <span>{t("entry.logisticsTitle")}</span>
            <h2>{t("entry.logisticsH2")}</h2>
            <p className="entry-card-p">
              {t("entry.logisticsP")}
            </p>
          </article>
        </section>

        <section className="entry-note">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            {t("entry.ready")}
          </span>
          <h2>{t("entry.fromFarm")}</h2>
          <Link className="text-link" href="/marketplace">
            {t("entry.explore")} <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </PublicLayout>
  );
}
