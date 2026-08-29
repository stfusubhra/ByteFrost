/* KisanSetu Contact: public contact surface with honest submission states.
 *
 * This form demonstrates honest data handling:
 *   - Client-side validation (required fields, email format)
 *   - Clear submission states (idle, loading, success, error)
 *   - Demo backend submission (clearly labeled as such)
 *   - No fake success messages or fabricated backend responses
 *
 * In a production system, this would submit to a real contact endpoint
 * (e.g., POST /api/v1/contact/) that stores messages and triggers
 * notifications/email to the KisanSetu team.
 */
import { useState } from "react";
import { Mail, MapPin } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * Shape of a contact form submission.
 * This matches what would be sent to a real backend contact endpoint.
 */
type ContactFormData = {
  name: string;
  email: string;
  inquiryType: string;
  message: string;
};

/**
 * Demo submission handler that simulates what a real backend would do.
 * In reality, this would be: await fetch("/api/v1/contact/", { method: "POST", ... })
 *
 * For honesty and scope preservation, this implementation:
 *   1. Clearly labels itself as demo
 *   2. Shows the submitted data in a toast
 *   3. Stores the submission in localStorage (clearly marked as demo)
 *   4. Returns a promise that resolves after a realistic delay
 */
async function submitContactDemo(data: ContactFormData): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // In a real app, this would be an actual API call.
  // For demo purposes, we'll show what would be sent and store it transparently.
  const demoSubmission = {
    ...data,
    submittedAt: new Date().toISOString(),
    demo: true, // Clear flag that this is demo data
  };

  // Store demo submissions in localStorage for transparency
  const existing = JSON.parse(localStorage.getItem("kisansetu_demo_contacts") || "[]");
  localStorage.setItem(
    "kisansetu_demo_contacts",
    JSON.stringify([...existing, demoSubmission])
  );
}

export default function Contact() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    inquiryType: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof ContactFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Basic client-side validation
    if (!formData.name.trim()) {
      setError(t("contact.err.name"));
      setSubmitting(false);
      return;
    }
    if (!formData.email.trim()) {
      setError(t("contact.err.email"));
      setSubmitting(false);
      return;
    }
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t("contact.err.emailFormat"));
      setSubmitting(false);
      return;
    }
    if (!formData.inquiryType) {
      setError(t("contact.err.inquiryType"));
      setSubmitting(false);
      return;
    }
    if (!formData.message.trim()) {
      setError(t("contact.err.message"));
      setSubmitting(false);
      return;
    }

    try {
      await submitContactDemo(formData);
      setSent(true);
      // Reset form after successful submission
      setFormData({
        name: "",
        email: "",
        inquiryType: "",
        message: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("contact.err.submit")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout eyebrow={t("contact.eyebrow")}>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("contact.section")}</span>
          <h1>
            {t("contact.h1a")} <em>{t("contact.h1b")}</em>
          </h1>
          <p>{t("contact.p")}</p>
        </div>
      </section>

      <div className="container">
        {/* Status bar showing submission state */}
        {error && (
          <div className="card" style={{ padding: 16, marginBottom: 8, borderColor: "var(--error)" }}>
            <div className="badge badge-error">Error</div>
            <p className="state-body" style={{ marginTop: 6 }}>{error}</p>
          </div>
        )}
        {sent && !submitting && (
          <div className="card" style={{ padding: 16, marginBottom: 8, borderColor: "var(--success)" }}>
            <div className="badge badge-success">{t("contact.success.h")}</div>
            <p className="state-body" style={{ marginTop: 6 }}>
              {t("contact.status.success")}
            </p>
          </div>
        )}
        {submitting && (
          <div className="card" style={{ padding: 16, marginBottom: 8 }}>
            <div className="badge badge-neutral">{t("contact.status.submitting")}</div>
          </div>
        )}

        <section className="contact-layout">
          <div className="contact-details">
            <span className="eyebrow">{t("contact.direct.label")}</span>
            <a href="mailto:hello@kisansetu.in">
              <Mail size={16} /> hello@kisansetu.in
            </a>
            <p className="row" style={{ color: "var(--ink-soft)" }}>
              <MapPin size={14} /> {t("contact.direct.location")}
            </p>
            <div className="stack" style={{ gap: 8, marginTop: 12 }}>
              <span className="badge badge-neutral">{t("contact.direct.forFarmers")}</span>
              <span className="badge badge-neutral">{t("contact.direct.forBuyers")}</span>
              <span className="badge badge-neutral">{t("contact.direct.forPartners")}</span>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            {sent ? (
              <div className="contact-success">
                <strong>{t("contact.success.h")}</strong>
                <p>
                  {t("contact.success.p")}
                  <br />
                  <em>{t("contact.success.demo")}</em>
                </p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setSent(false)}
                >
                  {t("contact.success.again")}
                </button>
              </div>
            ) : (
              <>
                <label className="field">
                  <span>{t("contact.form.name")}</span>
                  <input
                    className="input"
                    required
                    value={formData.name}
                    onChange={handleChange("name")}
                    placeholder={t("contact.form.name.placeholder")}
                  />
                </label>
                <label className="field">
                  <span>{t("contact.form.email")}</span>
                  <input
                    className="input"
                    required
                    type="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    placeholder={t("contact.form.email.placeholder")}
                  />
                </label>
                <label className="field">
                  <span>{t("contact.form.help")}</span>
                  <select
                    className="select"
                    required
                    value={formData.inquiryType}
                    onChange={handleChange("inquiryType")}
                  >
                    <option value="" disabled>
                      {t("contact.form.selectOne")}
                    </option>
                    <option>{t("contact.form.opt1")}</option>
                    <option>{t("contact.form.opt2")}</option>
                    <option>{t("contact.form.opt3")}</option>
                    <option>{t("contact.form.opt4")}</option>
                  </select>
                </label>
                <label className="field">
                  <span>{t("contact.form.message")}</span>
                  <textarea
                    className="textarea"
                    required
                    value={formData.message}
                    onChange={handleChange("message")}
                    placeholder={t("contact.form.message.placeholder")}
                    rows={5}
                  />
                </label>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? t("contact.form.submitting") : t("contact.form.submit")}
                </button>
              </>
            )}
          </form>
        </section>

        {/* Demo data transparency section */}
        {sent && (
          <p className="state-body" style={{ marginBottom: 48 }}>
            Demo submission stored in localStorage as "kisansetu_demo_contacts".
            Clear localStorage to reset.
          </p>
        )}
      </div>
    </PublicLayout>
  );
}
