/* KisanSetu FAQ: compact public answers for farmers, buyers, and first-time visitors. */
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useLanguage();

  const faqs = [
    [t("faq.q1"), t("faq.a1")],
    [t("faq.q2"), t("faq.a2")],
    [t("faq.q3"), t("faq.a3")],
    [t("faq.q4"), t("faq.a4")],
    [t("faq.q5"), t("faq.a5")],
    [t("faq.q6"), t("faq.a6")],
  ];

  return (
    <PublicLayout eyebrow={t("faq.eyebrow")}>
      <section className="public-hero faq-hero">
        <span>{t("faq.section")}</span>
        <h1>
          {t("faq.h1a")}
          <br />
          <em>{t("faq.h1b")}</em>
        </h1>
        <p>{t("faq.p")}</p>
      </section>

      <section className="faq-list public-reveal">
        {faqs.map(([question, answer], index) => (
          <div
            className={`faq-item ${open === index ? "open" : ""}`}
            key={index}
          >
            <button
              onClick={() => setOpen(open === index ? null : index)}
              aria-expanded={open === index}
            >
              <span>{question}</span>
              {open === index ? <Minus size={22} strokeWidth={1.5} /> : <Plus size={22} strokeWidth={1.5} />}
            </button>
            <div className="faq-answer">
              <div className="faq-answer-inner">
                <p>{answer}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </PublicLayout>
  );
}
