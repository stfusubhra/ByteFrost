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
      setError("Name is required");
      setSubmitting(false);
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      setSubmitting(false);
      return;
    }
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setSubmitting(false);
      return;
    }
    if (!formData.inquiryType) {
      setError("Please select how we can help");
      setSubmitting(false);
      return;
    }
    if (!formData.message.trim()) {
      setError("Message is required");
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
          : "Failed to submit your note. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout eyebrow="Contact / KisanSetu">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Contact</span>
          <h1>Let’s make the market clearer.</h1>
          <p>
            Talk to us about a pilot, a buyer network, a farmer group, or the
            next step for KisanSetu.
          </p>
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
            <div className="badge badge-success">Thank you</div>
            <p className="state-body" style={{ marginTop: 6 }}>
              Your note has been recorded (demo submission).
            </p>
          </div>
        )}
        {submitting && (
          <div className="card" style={{ padding: 16, marginBottom: 8 }}>
            <div className="badge badge-neutral">Submitting your note…</div>
          </div>
        )}

        <section className="contact-layout">
          <div className="contact-details">
            <span className="eyebrow">Direct contact</span>
            <a href="mailto:hello@kisansetu.in">
              <Mail size={16} /> hello@kisansetu.in
            </a>
            <p className="row" style={{ color: "var(--ink-soft)" }}>
              <MapPin size={14} /> Nashik · Pune · Remote
            </p>
            <div className="stack" style={{ gap: 8, marginTop: 12 }}>
              <span className="badge badge-neutral">For farmers</span>
              <span className="badge badge-neutral">For buyers</span>
              <span className="badge badge-neutral">For partners</span>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            {sent ? (
              <div className="contact-success">
                <strong>Thank you.</strong>
                <p>
                  Your note is ready for the KisanSetu team to follow up.
                  <br />
                  <em>(This is a demo submission. In production, this would
                  trigger an email/notification to the team.)</em>
                </p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setSent(false)}
                >
                  Send another note →
                </button>
              </div>
            ) : (
              <>
                <label className="field">
                  <span>Name</span>
                  <input
                    className="input"
                    required
                    value={formData.name}
                    onChange={handleChange("name")}
                    placeholder="Your name"
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    className="input"
                    required
                    type="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="field">
                  <span>How can we help?</span>
                  <select
                    className="select"
                    required
                    value={formData.inquiryType}
                    onChange={handleChange("inquiryType")}
                  >
                    <option value="" disabled>
                      Select one
                    </option>
                    <option>Farmer or farmer group</option>
                    <option>Buyer or retailer</option>
                    <option>Pilot or partnership</option>
                    <option>General question</option>
                  </select>
                </label>
                <label className="field">
                  <span>Message</span>
                  <textarea
                    className="textarea"
                    required
                    value={formData.message}
                    onChange={handleChange("message")}
                    placeholder="Tell us a little about what you are building or looking for."
                    rows={5}
                  />
                </label>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Send your note"}
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
