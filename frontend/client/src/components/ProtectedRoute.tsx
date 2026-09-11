import React from "react";
import { Redirect, Route } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  path: string;
  component: React.ComponentType<any>;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<Props> = ({ path, component: Component, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        // Wait for auth state to hydrate from localStorage before deciding.
        // Redirecting during the first render (before useEffect runs) bounces
        // logged-in users back to /login.
        if (isLoading) {
          return (
            <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          );
        }
        if (!isAuthenticated) {
          return <Redirect to="/login" />;
        }
        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
          const target =
            user.role === "farmer" || user.role === "fpo_manager"
              ? "/dashboard"
              : "/buyer-dashboard";
          return <Redirect to={target} />;
        }
        return <Component {...params} />;
      }}
    </Route>
  );
};
