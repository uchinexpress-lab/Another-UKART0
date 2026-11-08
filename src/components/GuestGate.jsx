import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";

// Sign-in gate for the payment flow (checkout, and the account pages after it).
// Browsing never passes through here, so a visitor can shop freely and is only
// asked to sign in when they are ready to pay. The cart is kept in localStorage,
// so it is still there when they come back from signing in.
export default function GuestGate({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in to continue",
        description: "Log in or create an account to complete your order.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return children;
}