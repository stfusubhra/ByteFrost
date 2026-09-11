"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function RequireRole({
  role,
  children,
}: {
  role: "farmer" | "buyer";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  useEffect(() => {
    // Wait for persisted state to hydrate before deciding
    if (!hasHydrated) return;

    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      // Redirect to the correct dashboard for their role
      router.replace(
        user.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard"
      );
    }
  }, [token, user, role, router, hasHydrated]);

  if (!hasHydrated || !token || !user || user.role !== role) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          Loading...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}