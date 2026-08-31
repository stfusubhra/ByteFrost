/* KisanSetu Auth Context — centralized auth state management.
 *
 * Features:
 *   - Single source of truth for token, user, and auth status
 *   - Automatic token attachment via api.ts interceptor (reads from localStorage)
 *   - Cross-tab logout propagation via storage event listener
 *   - Token refresh scaffold (to be implemented when backend supports refresh tokens)
 *   - Login/logout actions that update state and persist to localStorage
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api";

const TOKEN_KEY = "kisansetu_token";
const USER_KEY = "kisansetu_user";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch {
        // Ignore parse errors (corrupted localStorage)
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // Cross-tab logout sync: when another tab clears localStorage, react here
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        if (e.newValue === null) {
          // Another tab logged out
          setToken(null);
          setUser(null);
        } else if (e.key === USER_KEY) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            setUser(null);
          }
        }
      }
    };
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    // Clear local state immediately for responsive UI
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Optionally call backend logout endpoint if it exists
    // await api.post("/auth/logout").catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
      localStorage.setItem(USER_KEY, JSON.stringify(data));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Token expired or invalid
        await logout();
      }
      // For other errors, keep existing user (could be network issue)
    }
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}