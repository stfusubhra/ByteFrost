"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { demoUsers, DEMO_PASSWORD } from "@/lib/demoData";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  address?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  hasHydrated: boolean;
  setToken: (token: string) => void;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hasHydrated: false,
      setToken: (token) => set({ token }),
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "bf-auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Demo login helper — authenticates against the demo users.
// Returns { user, token } or throws with an error message.
export function demoLogin(identifier: string, password: string): {
  user: User;
  token: string;
} {
  const normalized = identifier.trim();
  const user = demoUsers.find(
    (u) => u.phone === normalized || u.email === normalized
  );
  if (!user) {
    throw new Error("Invalid mobile number or email");
  }
  if (password !== DEMO_PASSWORD) {
    throw new Error("Invalid password");
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      address: user.address,
    },
    token: `demo-token-${user.id}`,
  };
}