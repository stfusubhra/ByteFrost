import { create } from "zustand";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setToken: (token: string) => void;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("bf_token") : null,
  setToken: (token) => {
    localStorage.setItem("bf_token", token);
    set({ token });
  },
  setAuth: (user, token) => {
    localStorage.setItem("bf_token", token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("bf_token");
    set({ user: null, token: null });
  },
}));