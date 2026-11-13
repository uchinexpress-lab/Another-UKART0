import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, User, Mail, Lock } from 'lucide-react';

const SETUP_CODE = '184518';
const CODE_LENGTH = 6;

export default function AdminSetup() {
  const [step, setStep] = useState('code'); // 'code' | 'details'
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, [step]);

  const handleDigitChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < CODE_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const verifyCode = (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) { setError('Please enter all 6 digits'); return; }
    if (code !== SETUP_CODE) { setError('Invalid setup code'); return; }
    setError('');
    setStep('details');
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      // Step 1: Create the auth user via Supabase's signUp API.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName || 'Super Admin' } },
      });
      if (signUpError) throw new Error(signUpError.message);
      if (!signUpData?.user) throw new Error('Account creation failed. Please try again.');

      // Step 2: Promote the new user to super_admin via RPC.
      const { data: rpcData, error: rpcError } = await supabase.rpc('promote_to_super_admin', {
        p_email: email,
        p_full_name: fullName || 'Super Admin',
      });
      if (rpcError) throw new Error(rpcError.message);
      if (rpcData?.error) throw new Error(rpcData.error);

      setResult(rpcData || { success: true, email, message: 'Super admin account created' });
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Super Admin Ready</h1>
          <p className="text-gray-600 mb-6">
            Your super admin account is set up. From now on, just enter your email on the staff login page and we'll send you a secure link to sign in — no password needed.
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
          <h1 className="text-2xl font-bold text-white">
            {step === 'code' ? 'Super Admin Setup' : 'Create Your Account'}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {step === 'code' ? 'Enter your 6-digit setup code' : 'Set up your admin credentials'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 'code' && (
            <form onSubmit={verifyCode} className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {digits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-200 outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all"
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={digits.join('').length !== CODE_LENGTH}
                className="w-full h-12 bg-[#2E7D32] text-white text-sm font-bold rounded-lg hover:bg-[#1B5E20] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <KeyRound className="w-5 h-5" /> Verify Code
              </button>
            </form>
          )}

          {step === 'details' && (
            <form onSubmit={createAdmin} className="space-y-4">
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
              <button
                type="button"
                onClick={() => { setStep('code'); setError(''); }}
                className="w-full text-xs text-gray-500 hover:text-gray-700"
              >
                ← Back to code entry
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-white/40 text-xs mt-6">
          <a href="/" className="underline">← Back to Ukart</a>
        </p>
      </div>
    </div>
  );
}
