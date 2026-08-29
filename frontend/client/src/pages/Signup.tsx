import { useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

export default function Signup() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("farmer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) { setError(t("signup.err.fullName")); return; }
    if (!email.trim()) { setError(t("signup.err.email")); return; }
    if (password.length < 6) { setError(t("signup.err.passwordLength")); return; }
    if (password !== confirmPassword) { setError(t("signup.err.passwordMatch")); return; }
    setLoading(true);
    try {
      const response = await api.post("/auth/register", {
        email, phone, password, full_name: fullName || email.split("@")[0], role,
      });
      if (response.data?.access_token) {
        localStorage.setItem("kisansetu_token", response.data.access_token);
      }
      window.location.href = "/";
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) setError(t("signup.err.emailExists"));
      else if (status === 429) setError(t("signup.err.tooMany"));
      else setError(t("signup.err.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout tagline={t("signup.tagline")} support={t("signup.support")}>
      <div className="auth-form">
        <header className="auth-form-head">
          <h1>{t("signup.h1")}</h1>
          <p>{t("signup.p")}</p>
        </header>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label>{t("signup.role.label")}</label>
            <div className="auth-role" role="radiogroup" aria-label="Account type">
              <button type="button" className={`auth-role-opt ${role === "farmer" ? "active" : ""}`} onClick={() => setRole("farmer")} aria-pressed={role === "farmer"}>
                <strong>{t("signup.role.farmer")}</strong><span>{t("signup.role.farmer.sub")}</span>
              </button>
              <button type="button" className={`auth-role-opt ${role === "buyer" ? "active" : ""}`} onClick={() => setRole("buyer")} aria-pressed={role === "buyer"}>
                <strong>{t("signup.role.buyer")}</strong><span>{t("signup.role.buyer.sub")}</span>
              </button>
              <button type="button" className={`auth-role-opt ${role === "fpo" ? "active" : ""}`} onClick={() => setRole("fpo")} aria-pressed={role === "fpo"}>
                <strong>{t("signup.role.fpo")}</strong><span>{t("signup.role.fpo.sub")}</span>
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="fullName">{t("signup.fullName.label")}</label>
            <input type="text" id="fullName" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="auth-input" placeholder={t("signup.fullName.placeholder")} autoComplete="name" autoFocus />
          </div>

          <div className="auth-field">
            <label htmlFor="email">{t("signup.email.label")}</label>
            <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" placeholder={t("signup.email.placeholder")} autoComplete="email" />
          </div>

          <div className="auth-field">
            <label htmlFor="phone">{t("signup.phone.label")}</label>
            <input type="tel" id="phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="auth-input" placeholder={t("signup.phone.placeholder")} autoComplete="tel" />
          </div>

          <div className="auth-field">
            <label htmlFor="password">{t("signup.password.label")}</label>
            <div className="auth-input-wrap">
              <input type={showPassword ? "text" : "password"} id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" placeholder={t("signup.password.placeholder")} autoComplete="new-password" />
              <button type="button" className="auth-input-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t("signup.password.hide") : t("signup.password.show")} aria-pressed={showPassword}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">{t("signup.confirmPassword.label")}</label>
            <div className="auth-input-wrap">
              <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="auth-input" placeholder={t("signup.confirmPassword.placeholder")} autoComplete="new-password" />
              <button type="button" className="auth-input-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? t("signup.password.hide") : t("signup.password.show")} aria-pressed={showConfirmPassword}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? t("signup.submitting") : t("signup.submit")}
          </button>
        </form>

        <div className="auth-divider"><span>{t("common.or")}</span></div>
        <p className="auth-switch">
          {t("signup.alreadyRegistered")} <Link href="/login">{t("signup.signin")}</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
