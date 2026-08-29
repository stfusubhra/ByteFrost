import { useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data?.access_token) {
        localStorage.setItem("kisansetu_token", response.data.access_token);
      }
      window.location.href = "/";
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) {
        setError("Incorrect email or password.");
      } else if (status === 429) {
        setError("Too many attempts. Please try again shortly.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
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
          <h1>Welcome back</h1>
          <p>Sign in to your KisanSetu account.</p>
        </header>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
              autoFocus
              aria-invalid={!!error && !email.trim()}
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-label-row">
              <label htmlFor="password">Password</label>
              <a href="#" className="auth-forgot" onClick={(e) => e.preventDefault()}>
                Forgot password?
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
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={!!error && !password}
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

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <p className="auth-switch">
          Don't have an account? <Link href="/signup">Create account</Link>
        </p>

        <button
          type="button"
          className="auth-demo-toggle"
          onClick={() => setShowDemo(!showDemo)}
          aria-expanded={showDemo}
        >
          {showDemo ? "Hide demo access" : "Demo access"}
        </button>

        {showDemo && (
          <div className="auth-demo">
            <button type="button" onClick={() => handleDemoFill("farmer.demo@kisansetu.in")}>
              Farmer demo
            </button>
            <button type="button" onClick={() => handleDemoFill("buyer.demo@kisansetu.in")}>
              Buyer demo
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
