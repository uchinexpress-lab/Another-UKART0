import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bike, Loader2 } from 'lucide-react';

export default function RiderLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If already logged in and has approved rider profile, skip to home
    (async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const riders = await base44.entities.Rider.filter({ user_id: user.id }, { limit: 1 });
          if (riders.items?.length && riders.items[0].approval_status === 'approved') {
            navigate('/rider/home');
          }
        }
      } catch {}
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      // Check rider profile
      const user = await base44.auth.me();
      const riders = await base44.entities.Rider.filter({ user_id: user.id }, { limit: 1 });
      if (!riders.items?.length) {
        navigate('/rider/register');
        return;
      }
      const rider = riders.items[0];
      if (rider.approval_status === 'pending') {
        navigate('/rider/pending');
        return;
      }
      if (rider.approval_status === 'suspended') {
        setError('Your rider account has been suspended. Contact support.');
        return;
      }
      if (rider.approval_status !== 'approved') {
        setError('Your rider account is not active.');
        return;
      }
      window.location.href = '/rider/home';
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B4332] flex flex-col items-center justify-center px-6 max-w-md mx-auto">
      <div className="w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#2E7D32] flex items-center justify-center mb-3">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Ukart Rider</h1>
          <p className="text-sm text-green-200/70 mt-1">Sign in to start delivering</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-green-100/70 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="rider@example.com"
              className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 outline-none focus:border-green-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-green-100/70 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 outline-none focus:border-green-400"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2.5 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#2E9E44] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-green-200/70 mt-6">
          New rider?{' '}
          <button onClick={() => navigate('/rider/register')} className="text-green-300 font-semibold underline">
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}