import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Home, Bike, User, LogOut } from 'lucide-react';

export default function RiderLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  // RiderGuard already verified the rider and passes it via outlet context.
  // Fall back to our own check if used outside the guard (safety net).
  const ctx = useOutletContext();
  const [rider, setRider] = useState(ctx?.rider || null);
  const [loading, setLoading] = useState(!ctx?.rider);

  useEffect(() => {
    if (ctx?.rider) return; // already have rider from guard
    checkRider();
  }, []);

  const checkRider = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        navigate('/rider/login');
        return;
      }
      const riders = await base44.entities.Rider.filter({ user_id: user.id }, { limit: 1 });
      if (!riders.items?.length) {
        navigate('/rider/register');
        return;
      }
      const r = riders.items[0];
      if (r.approval_status !== 'approved') {
        navigate('/rider/pending');
        return;
      }
      setRider(r);
    } catch {
      navigate('/rider/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  const pathname = location.pathname;
  const navItems = [
    { icon: Home, label: 'Home', path: '/rider/home' },
    { icon: Bike, label: 'Delivery', path: '/rider/delivery' },
    { icon: User, label: 'Profile', path: '/rider/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <header className="bg-[#1B4332] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Bike className="w-5 h-5" />
          <span className="font-bold text-sm">Ukart Rider</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${rider?.is_online ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs font-medium">{rider?.is_online ? 'Online' : 'Offline'}</span>
        </div>
      </header>

      <main className="flex-1 pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex items-center justify-around py-2 z-30">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${active ? 'text-[#2E7D32]' : 'text-gray-400'}`}
            >
              <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}