import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles, User, AlertCircle, CheckCircle2 } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { api } from "../lib/api";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("farmer"); // farmer, buyer, fpo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        full_name: fullName || email.split("@")[0],
        role,
      });

      if (response.data?.access_token) {
        localStorage.setItem("kisansetu_token", response.data.access_token);
      }
      window.location.href = "/";
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout eyebrow="Registration · KisanSetu Direct Market Ledger">
      <div className="auth-wrapper">
        <div className="auth-card-container">
          <div className="auth-brand-side">
            <div className="auth-brand-content">
              <div className="auth-brand-badge">
                <Sparkles size={14} /> Join the Direct Network
              </div>
              <h1 className="auth-brand-title">Transforming farm-to-table economics</h1>
              <p className="auth-brand-desc">
                Create your verified profile to list produce, discover buyers, and access real-time price intelligence.
              </p>
            </div>

            <div className="auth-brand-stats">
              <div className="auth-stat-item">
                <strong>+24%</strong>
                <span>Avg Earnings Increase</span>
              </div>
              <div className="auth-stat-item">
                <strong>0%</strong>
                <span>Middleman Commission</span>
              </div>
            </div>
          </div>

          <div className="auth-form-side sm:w-full">
            <div className="auth-header">
              <h2>Create account</h2>
              <p>Join KisanSetu to buy or sell fresh produce directly.</p>
            </div>

            {error && (
              <div className="auth-error-box" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label>I am registering as a</label>
                <div className="role-selector">
                  <div
                    className={`role-card ${role === "farmer" ? "active" : ""}`}
                    onClick={() => setRole("farmer")} tabIndex={0}
                  >
                    <strong>🌾 Farmer</strong>
                    <span>Sell produce</span>
                  </div>
                  <div
                    className={`role-card ${role === "buyer" ? "active" : ""}`}
                    onClick={() => setRole("buyer")} tabIndex={0}
                  >
                    <strong>🏬 Buyer</strong>
                    <span>Order crops</span>
                  </div>
                  <div
                    className={`role-card ${role === "fpo" ? "active" : ""}`}
                    onClick={() => setRole("fpo")}
                  >
                    <strong>🤝 FPO</strong>
                    <span>Aggregate</span>
                  </div>
                </div>
              </div>

              <div className="auth-form-group">
                <label htmlFor="fullName">Full Name</label>
                <div className="auth-input-wrapper">
                  <User size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                    placeholder="Subhra Dey"
                    required
                  />
                </div>
              </div>

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
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="auth-input-toggle focus-visible:ring-2 focus-visible:ring-indigo-500"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="auth-input"
                    placeholder="Repeat password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-input-toggle focus-visible:ring-2 focus-visible:ring-indigo-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn focus-visible:ring-2 focus-visible:ring-indigo-500" disabled={loading}>
                {loading ? "Creating Account..." : "Create Free Account"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already registered? <Link href="/login">Sign in here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}