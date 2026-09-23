import React, { useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff, Mail, Smartphone } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api } from "../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { workspaceForRole } from "@/lib/roles";
import type { LocaleKeys } from "@/locales";

type LoginMethod = "email" | "phone";

/** Normalize an Indian mobile number to +91XXXXXXXXXX form. */
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("91")) return `+${digits}`;
  return value.trim();
}

// Canonical demo accounts (seeded by backend/seed_demo_data.py). Login is
// phone-based; these are the ONLY demo credentials in the product.
const DEMO_ACCOUNTS: Array<{ phone: string; password: string; labelKey: LocaleKeys }> = [
  { phone: "+919876543210", password: "demo1234", labelKey: "login.demo.farmer" },
  { phone: "+918888888888", password: "demo1234", labelKey: "login.demo.buyer" },
];

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [method, setMethod] = useState<LoginMethod>("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  /** Complete sign-in: persist auth, fetch the real profile, then route by role. */
  const completeLogin = async (token: string, role: string) => {
    login(token, {
      id: "",
      email: "",
      full_name: "",
      phone: null,
      role,
      is_verified: true,
      is_active: true,
      latitude: null,
      longitude: null,
      created_at: new Date().toISOString(),
    });
    // Fetch the full profile so the nav shows the real name immediately.
    try {
      const { data } = await api.get("/auth/me");
      login(token, data);
    } catch {
      // Profile fetch is best-effort; the token is already valid.
    }
    window.location.href = workspaceForRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (method === "email") {
      if (!email.trim()) {
        setError(t("login.err.emailRequired"));
        return;
      }
    } else {
      if (!phone.trim()) {
        setError(t("login.err.phoneRequired"));
        return;
      }
    }
    if (!password) {
      setError(t("login.err.passwordRequired"));
      return;
    }

    setLoading(true);
    try {
      const payload =
        method === "email"
          ? { email: email.trim(), password }
          : { phone: normalizePhone(phone), password };
      const response = await api.post("/auth/login", payload);
      if (response.data?.access_token && response.data?.role) {
        await completeLogin(response.data.access_token, response.data.role);
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) setError(t("login.err.invalid"));
      else if (status === 429) setError(t("login.err.tooMany"));
      else setError(t("login.err.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (demoPhone: string, demoPassword: string) => {
    // One-click demo login: fill the form with the seeded demo account and
    // submit immediately so judges can enter the app in a single click.
    setMethod("phone");
    setPhone(demoPhone.replace("+91", ""));
    setPassword(demoPassword);
    setError(null);
    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        phone: demoPhone,
        password: demoPassword,
      });
      if (response.data?.access_token && response.data?.role) {
        await completeLogin(response.data.access_token, response.data.role);
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) setError(t("login.err.invalid"));
      else if (status === 429) setError(t("login.err.tooMany"));
      else setError(t("login.err.generic"));
    } finally {
      setLoading(false);
    }
  };

  const switchMethod = (m: LoginMethod) => {
    setMethod(m);
    setError(null);
  };

  return (
    <AuthLayout>
      <div className="auth-form">
        <header className="auth-form-head">
          <h1>{t("login.h1")}</h1>
          <p>{t("login.p")}</p>
        </header>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email / Mobile tabs */}
          <div className="auth-tabs" role="tablist" aria-label="Login method">
            <button
              type="button"
              role="tab"
              aria-selected={method === "email"}
              className={`auth-tab ${method === "email" ? "active" : ""}`}
              onClick={() => switchMethod("email")}
            >
              <Mail size={15} />
              {t("login.tab.email")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={method === "phone"}
              className={`auth-tab ${method === "phone" ? "active" : ""}`}
              onClick={() => switchMethod("phone")}
            >
              <Smartphone size={15} />
              {t("login.tab.phone")}
            </button>
          </div>

          {method === "email" ? (
            <div className="auth-field">
              <label htmlFor="email">{t("login.email.label")}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder={t("login.email.placeholder")}
                autoComplete="email"
                autoFocus
                aria-invalid={!!error && !email.trim()}
              />
            </div>
          ) : (
            <div className="auth-field">
              <label htmlFor="phone">{t("login.phone.label")}</label>
              <div className="auth-phone-wrap">
                <span className="auth-phone-prefix">+91</span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                  className="auth-input auth-input-phone"
                  placeholder={t("login.phone.placeholder")}
                  autoComplete="tel"
                  autoFocus
                  inputMode="numeric"
                  aria-invalid={!!error && !phone.trim()}
                />
              </div>
              <p className="auth-field-hint">{t("login.phone.hint")}</p>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="password">{t("login.password.label")}</label>
            <div className="auth-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder={t("login.password.placeholder")}
                autoComplete="current-password"
                aria-invalid={!!error && !password}
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t("login.password.hide") : t("login.password.show")}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <div className="auth-divider"><span>{t("common.or")}</span></div>
        <p className="auth-switch">
          {t("login.noAccount")} <Link href="/signup">{t("login.createAccount")}</Link>
        </p>

        <button type="button" className="auth-demo-toggle" onClick={() => setShowDemo(!showDemo)} aria-expanded={showDemo}>
          {showDemo ? t("login.demo.hide") : t("login.demo.toggle")}
        </button>

        {showDemo && (
          <div className="auth-demo">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.phone}
                type="button"
                onClick={() => handleDemoFill(acc.phone, acc.password)}
                disabled={loading}
              >
                {t(acc.labelKey)}
              </button>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}