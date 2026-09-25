import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function BrowseGuard() {
  const { isAuthenticated, isGuest } = useAuth();
  if (!(isAuthenticated || isGuest)) {
    const onboardingDone =
      typeof window !== 'undefined' &&
      localStorage.getItem('ukart_onboarding_complete') === 'true';
    return <Navigate to={onboardingDone ? '/login' : '/onboarding'} replace />;
  }
  return <Outlet />;
}