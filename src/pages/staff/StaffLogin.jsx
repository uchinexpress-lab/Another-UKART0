import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Mail, Loader2, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      // Check if this email belongs to an approved staff member
      const { data: checkData, error: checkError } = await supabase.rpc('check_staff_email', {
        p_email: email.trim().toLowerCase(),
      });
      if (checkError) throw new Error(checkError.message);
      if (checkData?.is_staff === false) {
        throw new Error('This email is not registered as a staff member. Contact your super admin to be added.');
      }

      // Send magic link — reuse the existing OAuth callback route which
      // already handles session detection and redirect.
      const redirectTo = `${window.location.origin}/auth/callback?return_to=/admin`;
      const { error: linkError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: redirectTo },
      });
      if (linkError) throw new Error(linkError.message);

      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send login link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#1B4332] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#5FCF65] flex items-center justify-center text-3xl font-bold text-[#1B4332] mx-auto mb-4">
              U
            </div>
            <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-700 mb-2">
              We sent a login link to
            </p>
            <p className="text-gray-900 font-bold mb-6">{email}</p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in your email to sign in to the staff portal. The link expires in 1 hour.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-sm text-[#2E7D32] font-medium hover:underline"
            >
              ← Use a different email
            </button>
          </div>
          <p className="text-center text-white/40 text-xs mt-6">
            <a href="/" className="underline">← Back to Ukart</a>
          </p>
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
          <h1 className="text-2xl font-bold text-white">Ukart Staff Admin</h1>
          <p className="text-white/50 text-sm mt-1">Operations Management Portal</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Staff Sign In</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your staff email and we'll send you a secure link to sign in.
          </p>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Staff Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 h-11 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20"
                  placeholder="staff@ukart.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#2E7D32] text-white text-sm font-bold rounded-lg hover:bg-[#1B5E20] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending link...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Send Login Link
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
