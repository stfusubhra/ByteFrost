"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function RegisterPage() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer">("farmer");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">(
    "email"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Require at least one of email / mobile number
    if (!email && !phone) {
      setError("Please provide an email or a mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await auth.register({
        email: email || undefined,
        password,
        full_name: fullName,
        phone: phone || undefined,
        role,
      });
      const { access_token } = res.data;
      // Persist token first so the axios interceptor attaches it to /auth/me
      setToken(access_token);
      const me = await auth.me();
      setAuth(me.data, access_token);
      router.push(role === "farmer" ? "/farmer/dashboard" : "/marketplace");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-sm">
        <h2 className="mb-1 text-2xl font-bold text-green-800">
          Create your account
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Join ByteFrost — direct farm to market
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Sign up with
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setContactMethod("email")}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  contactMethod === "email"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600 hover:border-green-300"
                }`}
              >
                📧 Email
              </button>
              <button
                type="button"
                onClick={() => setContactMethod("phone")}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  contactMethod === "phone"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600 hover:border-green-300"
                }`}
              >
                📱 Mobile
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              You can also fill in both fields if you have both.
            </p>
          </div>

          {contactMethod === "email" && (
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          )}

          {contactMethod === "phone" && (
            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Mobile number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">
              I am a
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("farmer")}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  role === "farmer"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600 hover:border-green-300"
                }`}
              >
                🌾 Farmer
              </button>
              <button
                type="button"
                onClick={() => setRole("buyer")}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  role === "buyer"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600 hover:border-green-300"
                }`}
              >
                🏪 Buyer
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-green-600 hover:text-green-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}