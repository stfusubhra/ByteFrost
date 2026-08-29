import { useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
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

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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
      const status = err.response?.status;
      if (status === 409) {
        setError("An account with this email already exists.");
      } else if (status === 429) {
        setError("Too many attempts. Please try again shortly.");
      } else {
        setError("Unable to create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      tagline="Join the people who grow and the people who need."
      support="Verified profiles. Direct markets. Clearer decisions."
    >
      <div className="auth-form">
        <header className="auth-form-head">
          <h1>Create account</h1>
          <p>Join KisanSetu to buy or sell fresh produce directly.</p>
        </header>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label>I am registering as</label>
            <div className="auth-role" role="radiogroup" aria-label="Account type">
              <button
                type="button"
                className={`auth-role-opt ${role === "farmer" ? "active" : ""}`}
                onClick={() => setRole("farmer")}
                aria-pressed={role === "farmer"}
              >
                <strong>Farmer</strong>
                <span>Sell produce</span>
              </button>
              <button
                type="button"
                className={`auth-role-opt ${role === "buyer" ? "active" : ""}`}
                onClick={() => setRole("buyer")}
                aria-pressed={role === "buyer"}
              >
                <strong>Buyer</strong>
                <span>Order crops</span>
              </button>
              <button
                type="button"
                className={`auth-role-opt ${role === "fpo" ? "active" : ""}`}
                onClick={() => setRole("fpo")}
                aria-pressed={role === "fpo"}
              >
                <strong>FPO</strong>
                <span>Aggregate</span>
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="fullName">Full name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="auth-input"
              placeholder="Your full name"
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="auth-input-wrap">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <p className="auth-switch">
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
