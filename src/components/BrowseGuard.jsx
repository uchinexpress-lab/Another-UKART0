import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function BrowseGuard() {
  const { isAuthenticated, isGuest } = useAuth();
  if (!(isAuthenticated || isGuest)) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}