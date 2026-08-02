import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";

export default function GuestGate({ children }) {
  const { isGuest } = useAuth();

  useEffect(() => {
    if (isGuest) {
      toast({
        title: "Sign in required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
    }
  }, [isGuest]);

  if (isGuest) {
    return <Navigate to="/login" replace />;
  }
  return children;
}