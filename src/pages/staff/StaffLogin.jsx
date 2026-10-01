import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.get('returnTo')) {
        url.searchParams.set('returnTo', '/admin');
        window.history.replaceState({}, '', url);
      }
      await base44.auth.loginViaEmailPassword(email, password);
      // Fallback: if the SDK didn't hard-redirect, do it manually
      const returnTo = new URLSearchParams(window.location.search).get('returnTo') || '/admin';
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      // Safety net: clean up loading state after a brief delay.
      // If the redirect happened, the page is reloading and this callback never fires.
      // If the redirect failed, this ensures the user is not stuck on "Signing in...".
      setTimeout(() => setLoading(false), 300);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B4332] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#5FCF65] flex items-center justify-center text-3xl font-bold text-[#1B4332] mx-auto mb-4">
            U
          </div>
          <h1 className="text-2xl font-bold text-white">Ukart Staff Admin</h1>
          <p className="text-white/50 text-sm mt-1">Operations Management Portal</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Staff Sign In</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your staff credentials to continue</p>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 h-11 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
                  placeholder="staff@ukart.com"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 h-11 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#2E7D32] text-white text-sm font-bold rounded-lg hover:bg-[#1B5E20] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Sign In to Staff Portal
                </>
              )}
            </button>
          </form>
        </div>
        <p className="text-center text-white/40 text-xs mt-6">
          Authorized Ukart staff only. All actions are logged.
        </p>
        <div className="text-center mt-4">
          <a href="/" className="text-white/50 text-xs underline">
            ← Back to Ukart
          </a>
        </div>
      </div>
    </div>
  );
}