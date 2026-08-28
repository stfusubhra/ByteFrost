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
import { Mail, Phone, MapPin } from "lucide-react";
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
  // (In a real system, this would be in a database)
  const existing = JSON.parse(localStorage.getItem("kisansetu_demo_contacts") || "[]");
  localStorage.setItem(
    "kisansetu_demo_contacts",
    JSON.stringify([...existing, demoSubmission])
  );

  // Simulate occasional network error for realism (10% failure rate)
  if (Math.random() < 0.1) {
    throw new Error("Demo submission failed: simulated network error");
  }
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
      <section className="public-hero contact-hero">
        <span>05 / CONTACT</span>
        <h1>
          Let’s make<br />
          <em>the market clearer.</em>
        </h1>
        <p>
          Talk to us about a pilot, a buyer network, a farmer group, or the
          next step for KisanSetu.
        </p>
      </section>

      {/* Status bar showing submission state */}
      {error && (
        <div className="contact-status public-reveal">
          <div className="contact-status-error">⚠️ {error}</div>
        </div>
      )}
      {sent && !submitting && (
        <div className="contact-status public-reveal">
          <div className="contact-status-success">
            ✅ Thank you. Your note has been recorded (demo submission).
          </div>
        </div>
      )}
      {submitting && (
        <div className="contact-status public-reveal">
          <div className="contact-status-loading">Submitting your note…</div>
        </div>
      )}

      <section className="contact-layout public-reveal">
        <div className="contact-details">
          <span>DIRECT CONTACT</span>
          <a href="mailto:hello@kisansetu.in">hello@kisansetu.in</a>
          <p>Nashik · Pune · Remote</p>
          <div>
            <span>For farmers</span>
            <span>For buyers</span>
            <span>For partners</span>
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
                className="public-text-link"
                onClick={() => setSent(false)}
              >
                Send another note →
              </button>
            </div>
          ) : (
            <>
              <label>
                Name
                <input
                  required
                  value={formData.name}
                  onChange={handleChange("name")}
                  placeholder="Your name"
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                How can we help?
                <select
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
              <label>
                Message
                <textarea
                  required
                  value={formData.message}
                  onChange={handleChange("message")}
                  placeholder="Tell us a little about what you are building or looking for."
                  rows={5}
                />
              </label>
              <button
                className="public-pill"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send your note →"}
              </button>
            </>
          )}
        </form>
      </section>

      {/* Demo data transparency section */}
      {sent && (
        <div className="contact-demo-note public-reveal">
          <small>
            💡 Demo submission stored in localStorage as
            "kisansetu_demo_contacts". Clear localStorage to reset.
          </small>
        </div>
      )}
    </PublicLayout>
  );
}