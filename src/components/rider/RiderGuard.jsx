import { useState, useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bike } from 'lucide-react';

/**
 * Access control for the Rider app.
 *
 * - Not logged in          → redirect to /rider/login
 * - No Rider profile        → redirect to /rider/register
 * - Pending approval        → redirect to /rider/pending
 * - Suspended / inactive    → redirect to /rider/login (with error)
 * - Approved                → render protected routes via <Outlet />
 *
 * This prevents customers (who have no Rider entity) from accessing rider
 * pages, and prevents unapproved riders from reaching the dashboard.
 */
export default function RiderGuard() {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, redirect: null, rider: null });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        setState({ loading: false, redirect: '/rider/login', rider: null });
        return;
      }

      const riders = await base44.entities.Rider.filter({ user_id: user.id }, { limit: 1 });
      if (!riders.items?.length) {
        setState({ loading: false, redirect: '/rider/register', rider: null });
        return;
      }

      const rider = riders.items[0];
      if (rider.approval_status === 'pending') {
        setState({ loading: false, redirect: '/rider/pending', rider: null });
        return;
      }
      if (rider.approval_status !== 'approved') {
        // Suspended or inactive — send back to login with a flag
        setState({
          loading: false,
          redirect: '/rider/login?suspended=1',
          rider: null,
        });
        return;
      }

      setState({ loading: false, redirect: null, rider });
    } catch {
      setState({ loading: false, redirect: '/rider/login', rider: null });
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1B4332]">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
          <Bike className="w-8 h-8 text-white/60 animate-pulse" />
        </div>
        <div className="w-8 h-8 border-4 border-white/20 border-t-[#5FCF65] rounded-full animate-spin" />
      </div>
    );
  }

  if (state.redirect) {
    return <Navigate to={state.redirect} replace state={{ from: location.pathname }} />;
  }

  // Render nested routes; pass rider via outlet context for layout/pages
  return <Outlet context={{ rider: state.rider }} />;
}