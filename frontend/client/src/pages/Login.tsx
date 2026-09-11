import React, { useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff, Mail, Smartphone } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api } from "../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

type LoginMethod = "email" | "phone";

/** Normalize an Indian mobile number to +91XXXXXXXXXX form. */
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("91")) return `+${digits}`;
  return value.trim();
}

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [method, setMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

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
        // Store token and user info via AuthContext (includes role)
        login(response.data.access_token, {
          id: response.data.user_id,
          email: response.data?.email ?? "",
          full_name: "",
          phone: method === "phone" ? (payload.phone ?? null) : null,
          role: response.data.role,
          is_verified: true,
          is_active: true,
          latitude: null,
          longitude: null,
          created_at: new Date().toISOString(),
        });
        // Redirect based on role
        if (response.data.role === "farmer" || response.data.role === "fpo_manager") {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/buyer-dashboard";
        }
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

  const handleDemoFill = (demoIdentifier: string) => {
    if (demoIdentifier.includes("@")) {
      setMethod("email");
      setEmail(demoIdentifier);
    } else {
      setMethod("phone");
      setPhone(demoIdentifier);
    }
    setPassword("demo123456");
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
            <div className="auth-field-label-row">
              <label htmlFor="password">{t("login.password.label")}</label>
              <a href="#" className="auth-forgot" onClick={(e) => e.preventDefault()}>
                {t("login.password.forgot")}
              </a>
            </div>
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
            <button type="button" onClick={() => handleDemoFill("farmer.demo@kisansetu.in")}>{t("login.demo.farmer")}</button>
            <button type="button" onClick={() => handleDemoFill("buyer.demo@kisansetu.in")}>{t("login.demo.buyer")}</button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}