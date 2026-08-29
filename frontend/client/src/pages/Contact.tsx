/* KisanSetu Contact: public contact surface with honest submission states. */
import { useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

type ContactFormData = {
  name: string;
  email: string;
  inquiryType: string;
  message: string;
};

async function submitContactDemo(data: ContactFormData): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const demoSubmission = { ...data, submittedAt: new Date().toISOString(), demo: true };
  const existing = JSON.parse(localStorage.getItem("kisansetu_demo_contacts") || "[]");
  localStorage.setItem("kisansetu_demo_contacts", JSON.stringify([...existing, demoSubmission]));
}

export default function Contact() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ContactFormData>({ name: "", email: "", inquiryType: "", message: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof ContactFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    if (!formData.name.trim()) { setError(t("contact.err.name")); setSubmitting(false); return; }
    if (!formData.email.trim()) { setError(t("contact.err.email")); setSubmitting(false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError(t("contact.err.emailFormat")); setSubmitting(false); return; }
    if (!formData.inquiryType) { setError(t("contact.err.inquiryType")); setSubmitting(false); return; }
    if (!formData.message.trim()) { setError(t("contact.err.message")); setSubmitting(false); return; }

    try {
      await submitContactDemo(formData);
      setSent(true);
      setFormData({ name: "", email: "", inquiryType: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("contact.err.submit"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout eyebrow={t("contact.eyebrow")}>
      <section className="public-hero contact-hero">
        <span>{t("contact.section")}</span>
        <h1>
          {t("contact.h1a")}<br />
          <em>{t("contact.h1b")}</em>
        </h1>
        <p>{t("contact.p")}</p>
      </section>

      {error && (
        <div className="contact-status public-reveal">
          <div className="contact-status-error">⚠️ {error}</div>
        </div>
      )}
      {sent && !submitting && (
        <div className="contact-status public-reveal">
          <div className="contact-status-success">{t("contact.status.success")}</div>
        </div>
      )}
      {submitting && (
        <div className="contact-status public-reveal">
          <div className="contact-status-loading">{t("contact.status.submitting")}</div>
        </div>
      )}

      <section className="contact-layout public-reveal">
        <div className="contact-details">
          <span>{t("contact.direct.label")}</span>
          <a href="mailto:hello@kisansetu.in">hello@kisansetu.in</a>
          <p>{t("contact.direct.location")}</p>
          <div>
            <span>{t("contact.direct.forFarmers")}</span>
            <span>{t("contact.direct.forBuyers")}</span>
            <span>{t("contact.direct.forPartners")}</span>
          </div>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          {sent ? (
            <div className="contact-success">
              <strong>{t("contact.success.h")}</strong>
              <p>
                {t("contact.success.p")}<br />
                <em>{t("contact.success.demo")}</em>
              </p>
              <button type="button" className="public-text-link" onClick={() => setSent(false)}>
                {t("contact.success.again")}
              </button>
            </div>
          ) : (
            <>
              <label>
                {t("contact.form.name")}
                <input required value={formData.name} onChange={handleChange("name")} placeholder={t("contact.form.name.placeholder")} />
              </label>
              <label>
                {t("contact.form.email")}
                <input required type="email" value={formData.email} onChange={handleChange("email")} placeholder={t("contact.form.email.placeholder")} />
              </label>
              <label>
                {t("contact.form.help")}
                <select required value={formData.inquiryType} onChange={handleChange("inquiryType")}>
                  <option value="" disabled>{t("contact.form.selectOne")}</option>
                  <option>{t("contact.form.opt1")}</option>
                  <option>{t("contact.form.opt2")}</option>
                  <option>{t("contact.form.opt3")}</option>
                  <option>{t("contact.form.opt4")}</option>
                </select>
              </label>
              <label>
                {t("contact.form.message")}
                <textarea required value={formData.message} onChange={handleChange("message")} placeholder={t("contact.form.message.placeholder")} rows={5} />
              </label>
              <button className="public-pill" type="submit" disabled={submitting}>
                {submitting ? t("contact.form.submitting") : t("contact.form.submit")}
              </button>
            </>
          )}
        </form>
      </section>

      {sent && (
        <div className="contact-demo-note public-reveal">
          <small>💡 Demo submission stored in localStorage as "kisansetu_demo_contacts". Clear localStorage to reset.</small>
        </div>
      )}
    </PublicLayout>
  );
}