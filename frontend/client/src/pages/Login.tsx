import { useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError(t("login.err.emailRequired")); return; }
    if (!password) { setError(t("login.err.passwordRequired")); return; }
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data?.access_token) {
        localStorage.setItem("kisansetu_token", response.data.access_token);
      }
      window.location.href = "/";
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) setError(t("login.err.invalid"));
      else if (status === 429) setError(t("login.err.tooMany"));
      else setError(t("login.err.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123456");
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
          <div className="auth-field">
            <label htmlFor="email">{t("login.email.label")}</label>
            <input
              type="email" id="email" name="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="auth-input" placeholder={t("login.email.placeholder")}
              autoComplete="email" autoFocus aria-invalid={!!error && !email.trim()}
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-label-row">
              <label htmlFor="password">{t("login.password.label")}</label>
              <a href="#" className="auth-forgot" onClick={(e) => e.preventDefault()}>
                {t("login.password.forgot")}
              </a>
            </div>
            <div className="auth-input-wrap">
              <input
                type={showPassword ? "text" : "password"} id="password" name="password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="auth-input" placeholder={t("login.password.placeholder")}
                autoComplete="current-password" aria-invalid={!!error && !password}
              />
              <button
                type="button" className="auth-input-toggle"
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
