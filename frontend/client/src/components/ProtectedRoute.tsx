import React from "react";
import { Redirect, Route } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  path: string;
  component: React.ComponentType<any>;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<Props> = ({ path, component: Component, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
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
