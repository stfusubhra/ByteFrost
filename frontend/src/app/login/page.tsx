"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, demoLogin } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { user, token, hasHydrated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, go straight to the dashboard
  useEffect(() => {
    if (hasHydrated && token && user) {
      router.replace(
        user.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard"
      );
    }
  }, [hasHydrated, token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user, token } = demoLogin(email, password);
      setAuth(user, token);
      router.push(user.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "farmer" | "buyer") => {
    setError("");
    if (role === "farmer") {
      setEmail("+919999999999");
      setPassword("demo1234");
    } else {
      setEmail("+918888888888");
      setPassword("demo1234");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-sm">
        <h2 className="mb-1 text-2xl font-bold text-green-800">
          Welcome back
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Sign in to your Kisan Setu account
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Mobile number or email
            </label>
            <input
              id="email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-green-100 bg-green-50 p-4">
          <p className="mb-2 text-xs font-semibold text-green-800">
            Demo Accounts — click to autofill
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("farmer")}
              className="rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
            >
              🌾 Farmer / Lister
            </button>
            <button
              type="button"
              onClick={() => fillDemo("buyer")}
              className="rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
            >
              🏪 Buyer
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-green-600 hover:text-green-700">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
