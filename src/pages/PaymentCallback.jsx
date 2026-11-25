import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { Loader2, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react';

const readPendingOrder = () => {
  try {
    return sessionStorage.getItem('ukart_pending_order');
  } catch {
    return null;
  }
};

const forgetPendingOrder = () => {
  try {
    sessionStorage.removeItem('ukart_pending_order');
  } catch {}
};

// Returns the customer from Paystack. The screen shown is decided ONLY by the
// server's verification of the transaction — never by the fact that the
// customer came back.
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const reference = params.get('reference') || params.get('trxref');

  const [state, setState] = useState('verifying'); // verifying | pending | error
  const [reason, setReason] = useState('');

  const verify = useCallback(async () => {
    setState('verifying');
    setReason('');

    if (!reference) {
      setState('error');
      setReason('No payment reference was returned by Paystack.');
      return;
    }

    try {
      const res = await base44.functions.invoke('process-paystack-payment', {
        action: 'verify',
        reference,
      });
      const data = res || {};
      if (data.ok && data.orderId) {
        clearCart();
        forgetPendingOrder();
        navigate(`/orders/${data.orderId}/payment-success`, { replace: true });
        return;
      }

      // Paystack has not settled the transaction yet (e.g. bank transfer).
      if (data.pending) {
        setState('pending');
        return;
      }

      // Verification returned an error — but Paystack may have still charged
      // the customer. Do NOT abandon. Show a recovery state that lets the
      // customer check again (the webhook may finalize the order shortly).
      setState('error');
      setReason(
        data.reason ||
          'We could not confirm your payment right now. If Paystack sent you a receipt, your order will appear shortly — please check again.'
      );
    } catch (e) {
      // Verification unreachable — this is NOT a failed payment.
      setState('error');
      setReason(e?.response?.data?.error || e?.message || 'We could not reach the payment service.');
    }
  }, [reference, clearCart, navigate]);

  useEffect(() => {
    verify();
  }, [verify]);

  if (state === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-retail mb-3" />
        <p className="text-[15px] font-bold text-foreground">Verifying your payment…</p>
        <p className="uk-sub mt-1">Please wait while we confirm your transaction with Paystack.</p>
      </div>
    );
  }

  const Icon = state === 'pending' ? Clock : AlertCircle;
  const iconTone =
    state === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-amber-100 text-amber-700';
  const title =
    state === 'pending'
      ? 'Still confirming your payment'
      : "We couldn't confirm your payment yet";

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${iconTone}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-[320px]">
        {state === 'pending'
          ? 'Paystack is still settling this transaction. Your order will update automatically as soon as it completes — you can safely check again.'
          : reason ||
            'If Paystack sent you a receipt, your payment went through. Your order will appear in your order history shortly. Please check again in a moment.'}
      </p>

      <div className="w-full max-w-[320px] mt-5 space-y-2">
        <button onClick={verify} className="uk-btn">
          <RefreshCw className="w-4 h-4" /> Check again
        </button>

        <Link to="/orders" className="uk-btn-outline">
          View my orders
        </Link>
        <Link to="/cart" className="block text-xs font-semibold text-muted-foreground py-2">
          Back to cart
        </Link>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-retail" />
        Your cart is preserved until your payment is confirmed.
      </p>
    </div>
  );
}