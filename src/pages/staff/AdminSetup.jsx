import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Mail, Lock, User, Loader2, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminSetup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('setup_super_admin', {
        p_email: email,
        p_password: password,
        p_full_name: fullName || 'Super Admin',
      });

      if (rpcError) throw new Error(rpcError.message);
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to create admin account');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-[#1B4332] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Account Created</h1>
          <p className="text-gray-600 mb-6">
            Your super admin account is ready. You can now log in to the staff portal.
          </p>
          <a
            href="/admin/login"
            className="inline-flex items-center justify-center h-11 px-6 bg-[#2E7D32] text-white text-sm font-bold rounded-lg hover:bg-[#1B5E20]"
          >
            Go to Staff Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1B4332] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#5FCF65] flex items-center justify-center text-3xl font-bold text-[#1B4332] mx-auto mb-4">
            U
          </div>
          <h1 className="text-2xl font-bold text-white">Create Super Admin</h1>
          <p className="text-white/50 text-sm mt-1">Set up your Ukart admin account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-2 mb-6 bg-amber-50 text-amber-700 text-sm rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>This page only works once, before any admin exists.</span>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 h-11 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
                  placeholder="Ukart Admin"
                />
              </div>
            </div>
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
                  placeholder="admin@ukart.com"
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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 h-11 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#2E7D32] text-white text-sm font-bold rounded-lg hover:bg-[#1B5E20] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Create Super Admin</>
              )}
            </button>
          </form>
        </div>
        <p className="text-center text-white/40 text-xs mt-6">
          <a href="/" className="underline">← Back to Ukart</a>
        </p>
      </div>
    </div>
  );
}
