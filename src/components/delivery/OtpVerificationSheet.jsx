import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  ShieldCheck, Loader2, AlertCircle, RefreshCw, Headphones,
  CheckCircle2, Lock, Mail, MessageSquare, X,
} from 'lucide-react';

export default function OtpVerificationSheet({ delivery, onVerified, onResend }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [otpStatus, setOtpStatus] = useState(null);
  const [generating, setGenerating] = useState(false);
  const inputsRef = useRef([]);

  // Auto-generate OTP when delivery enters "arrived" state and no OTP is active yet
  useEffect(() => {
    if (delivery?.status === 'arrived' && !delivery.otp_active && !generating && !success) {
      setGenerating(true);
      (async () => {
        try {
          const res = await base44.functions.invoke('generateDeliveryOtp', { deliveryId: delivery.id });
          setOtpStatus(res);
        } catch (e) {
          setError(e.message || 'Failed to generate verification code');
        } finally {
          setGenerating(false);
        }
      })();
    }
  }, [delivery?.status, delivery?.otp_active, delivery?.id]);

  // Focus first input on mount
  useEffect(() => {
    if (delivery?.status === 'arrived' && delivery?.otp_active && !success) {
      inputsRef.current[0]?.focus();
    }
  }, [delivery?.otp_active, success]);

  const handleCodeChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newCode = pasted.split('').concat(Array(6 - pasted.length).fill(''));
      setCode(newCode);
      inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await base44.functions.invoke('verifyDeliveryOtp', {
        deliveryId: delivery.id,
        code: fullCode,
      });
      if (res.verified) {
        setSuccess(true);
        setTimeout(() => onVerified?.(res), 1500);
      }
    } catch (e) {
      const msg = e.message || 'Verification failed';
      if (msg.includes('locked')) {
        setError('Verification temporarily locked. Contact Ukart support/admin.');
      } else if (msg.includes('expired')) {
        setError('Code has expired. Please request a new code.');
      } else {
        setError('Incorrect delivery code. ' + (msg));
      }
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await base44.functions.invoke('resendDeliveryOtp', {
        deliveryId: delivery.id,
        requestedBy: 'rider',
      });
      setOtpStatus(res);
      setShowHelp(false);
    } catch (e) {
      const msg = e.message || 'Failed to resend';
      if (msg.includes('wait') || msg.includes('rate')) {
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-green-800">✓ Delivery Verified</h3>
        <p className="text-sm text-green-600 mt-1">Customer received the order.</p>
      </div>
    );
  }

  const isLocked = delivery.otp_locked_until && new Date(delivery.otp_locked_until) > new Date();
  const attemptsRemaining = (delivery.otp_max_attempts || 5) - (delivery.otp_attempts || 0);

  return (
    <div className="bg-white rounded-2xl border-2 border-[#1B4332]/20 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Delivery Verification</h3>
          <p className="text-xs text-gray-500">Order #{delivery.order_number} · {delivery.customer_name}</p>
        </div>
      </div>

      {/* Generating state */}
      {generating && (
        <div className="flex items-center justify-center py-4 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#2E7D32]" />
          <span className="text-sm text-gray-500">Sending verification code to customer...</span>
        </div>
      )}

      {/* Send status */}
      {otpStatus && !generating && (
        <div className="bg-blue-50 rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-blue-700">Verification code sent to customer</p>
          <div className="flex items-center gap-3 text-xs text-blue-600">
            {otpStatus.email === 'sent' && (
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email sent</span>
            )}
            {otpStatus.sms === 'sent' && (
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> SMS sent</span>
            )}
            {otpStatus.sms === 'not_configured' && (
              <span className="flex items-center gap-1 text-gray-400"><MessageSquare className="w-3 h-3" /> SMS not configured</span>
            )}
            {otpStatus.email === 'failed' && (
              <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3 h-3" /> Email failed</span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Ask the customer to check their {otpStatus.email === 'sent' ? 'email' : 'phone'} and give you the code.
          </p>
        </div>
      )}

      {/* Locked state */}
      {isLocked ? (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <Lock className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-700">Verification Locked</p>
          <p className="text-xs text-red-600 mt-1">
            Too many incorrect attempts. Contact Ukart support/admin.
          </p>
        </div>
      ) : (
        !generating && (
          <>
            {/* OTP input */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Enter customer's delivery code:</p>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none focus:border-[#2E7D32] transition-colors"
                    style={{ borderColor: error ? '#ef4444' : '#e5e7eb' }}
                  />
                ))}
              </div>
              {attemptsRemaining < 5 && attemptsRemaining > 0 && (
                <p className="text-xs text-amber-600 text-center mt-2">
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 rounded-xl p-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={verifying || code.join('').length !== 6}
              className="w-full h-14 rounded-2xl bg-[#1B4332] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {verifying ? 'Verifying...' : 'Verify Delivery'}
            </button>

            {/* Help section */}
            {!showHelp ? (
              <button
                onClick={() => setShowHelp(true)}
                className="w-full text-xs font-semibold text-gray-500 underline"
              >
                Customer didn't receive code?
              </button>
            ) : (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 space-y-2">
                <p className="text-xs text-amber-700">
                  Ask the customer to check their phone/email or request a new code.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="flex-1 h-10 rounded-xl bg-[#2E7D32] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Resend Code
                  </button>
                  <a
                    href="/admin/live-deliveries"
                    className="flex-1 h-10 rounded-xl bg-white border border-gray-300 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Headphones className="w-3.5 h-3.5" /> Contact Admin
                  </a>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full text-xs text-gray-400 flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" /> Close
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}