import React from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("marketplace.backendError")}</span>
          <h1>{t("notfound.h1")}</h1>
          <p>
            {t("notfound.p")}
          </p>
          <div className="mt-7">
            <Link className="btn btn-primary" href="/">
              {t("notfound.home")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
