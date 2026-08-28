import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { api } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data?.access_token) {
        localStorage.setItem("kisansetu_token", response.data.access_token);
      }
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Sign in failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123456");
  };

  return (
    <PublicLayout eyebrow="Secure Access · KisanSetu Direct Market Ledger">
      <div className="auth-wrapper">
        <div className="auth-card-container">
          <div className="auth-brand-side">
            <div className="auth-brand-content">
              <div className="auth-brand-badge">
                <Sparkles size={14} /> AI-Powered Supply Chain
              </div>
              <h1 className="auth-brand-title">Direct farm-to-market intelligence</h1>
              <p className="auth-brand-desc">
                Connect directly with buyers, eliminate intermediary margin stacking, and optimize produce routing.
              </p>
            </div>

            <div className="auth-brand-stats">
              <div className="auth-stat-item">
                <strong>4.8/5</strong>
                <span>Farmer Trust Score</span>
              </div>
              <div className="auth-stat-item">
                <strong>100%</strong>
                <span>Verifiable Provenance</span>
              </div>
            </div>
          </div>

          <div className="auth-form-side">
            <div className="auth-header">
              <h2>Welcome back</h2>
              <p>Sign in to manage listings, track shipments, and view market matches.</p>
            </div>

            {error && (
              <div className="auth-error-box" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label htmlFor="email">Email address</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    placeholder="name@farmco.in"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label htmlFor="password">Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign in to Account"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="demo-login-divider">
              <span>OR DEMO QUICK SIGN-IN</span>
            </div>

            <div className="demo-quick-btns">
              <button
                type="button"
                className="demo-quick-btn"
                onClick={() => handleDemoFill("farmer.demo@kisansetu.in")}
              >
                🌾 Demo Farmer
              </button>
              <button
                type="button"
                className="demo-quick-btn"
                onClick={() => handleDemoFill("buyer.demo@kisansetu.in")}
              >
                🏬 Demo Buyer
              </button>
            </div>

            <div className="auth-footer">
              <p>
                Don't have an account? <Link href="/signup">Create account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}