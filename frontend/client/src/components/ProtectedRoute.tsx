import React from "react";
import { RouteComponentProps, Redirect, Route } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface Props extends RouteComponentProps {
  allowedRoles?: string[]; // if omitted, any authenticated user can access
}

export const ProtectedRoute: React.FC<Props> = ({ allowedRoles, ...rest }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // redirect to appropriate dashboard based on role
    const target = user.role === "farmer" || user.role === "fpo_manager" ? "/dashboard" : "/buyer-dashboard";
    return <Redirect to={target} />;
  }
  return <Route {...rest} />;
};
