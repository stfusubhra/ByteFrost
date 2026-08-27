"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function Header() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="border-b border-green-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-green-700">
          ByteFrost
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-green-600">
            Home
          </Link>
          <Link href="/marketplace" className="hover:text-green-600">
            Marketplace
          </Link>
          {token && user ? (
            <>
              <Link
                href={
                  user.role === "farmer" ? "/farmer/dashboard" : "/buyer/orders"
                }
                className="hover:text-green-600"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="rounded-lg bg-green-600 px-3 py-1.5 font-medium text-white hover:bg-green-700"
              >
                {user.full_name.split(" ")[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-green-600">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-green-600 px-3 py-1.5 font-medium text-white hover:bg-green-700"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}