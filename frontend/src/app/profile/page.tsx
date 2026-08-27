"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState("");

  // If we only have a token (e.g. after page refresh), fetch the full user
  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (user) {
      setLoading(false);
      return;
    }
    auth
      .me()
      .then((res) => {
        setAuth(res.data, token);
        setLoading(false);
      })
      .catch(() => {
        logout();
        router.replace("/login");
      });
  }, [token, user, setAuth, logout, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  if (!user) return null;

  const roleLabel = user.role === "farmer" ? "🌾 Farmer" : "🏪 Buyer";

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold text-green-800">My Profile</h2>

      <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.full_name}
            </h3>
            <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              {roleLabel}
            </span>
          </div>
        </div>

        <dl className="divide-y divide-gray-100 border-t border-gray-100">
          <div className="flex justify-between py-3">
            <dt className="text-sm text-gray-500">Email</dt>
            <dd className="text-sm font-medium text-gray-900">{user.email}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-sm text-gray-500">Role</dt>
            <dd className="text-sm font-medium text-gray-900 capitalize">
              {user.role}
            </dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-sm text-gray-500">User ID</dt>
            <dd className="text-sm font-mono text-gray-900">{user.id}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          <Link
            href={user.role === "farmer" ? "/farmer/dashboard" : "/marketplace"}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Go to {user.role === "farmer" ? "Dashboard" : "Marketplace"}
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}