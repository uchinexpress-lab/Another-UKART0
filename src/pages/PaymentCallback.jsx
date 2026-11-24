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

  const [state, setState] = useState('verifying'); // verifying | pending | failed | error
  const [orderId, setOrderId] = useState(null);
  const [reason, setReason] = useState('');
  const [retrying, setRetrying] = useState(false);

  const verify = useCallback(async () => {
    setState('verifying');
    setReason('');

    if (!reference) {
      setState('failed');
      setOrderId(readPendingOrder());
      setReason('No payment reference was returned by Paystack.');
      return;
    }

    try {
      const res = await base44.functions.invoke('verifyPaystackPayment', { reference });
      const data = res.data || {};
      if (data.orderId) setOrderId(data.orderId);

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

      // Definitively not paid: close the attempt, keep the order for the record.
      setState('failed');
      setReason(data.reason || 'The payment was not completed.');
      try {
        await base44.functions.invoke('abandonCheckout', {
          orderId: data.orderId || readPendingOrder() || undefined,
          reference,
        });
      } catch {}
      forgetPendingOrder();
    } catch (e) {
      // Verification unreachable — this is NOT a failed payment.
      setState('error');
      setOrderId(readPendingOrder());
      setReason(e?.response?.data?.error || e?.message || 'We could not reach the payment service.');
    }
  }, [reference, clearCart, navigate]);

  useEffect(() => {
    verify();
  }, [verify]);

  const payAgain = async () => {
    const id = orderId || readPendingOrder();
    if (!id) return;
    setRetrying(true);
    try {
      const res = await base44.functions.invoke('initiatePaystackPayment', {
        orderId: id,
        callbackUrl: `${window.location.origin}/payment/callback`,
      });
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
        return;
      }
    } catch {}
    setRetrying(false);
  };

  if (state === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-retail mb-3" />
        <p className="text-[15px] font-bold text-foreground">Verifying your payment…</p>
        <p className="uk-sub mt-1">Please wait while we confirm your transaction with Paystack.</p>
      </div>
    );
  }

  const Icon = state === 'pending' ? Clock : state === 'error' ? AlertCircle : AlertCircle;
  const iconTone =
    state === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';
  const title =
    state === 'pending'
      ? 'Still confirming your payment'
      : state === 'error'
      ? "We couldn't confirm your payment"
      : 'Payment not completed';

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${iconTone}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-[300px]">
        {state === 'pending'
          ? 'Paystack is still settling this transaction. Your order will update automatically as soon as it completes — you can safely check again.'
          : state === 'error'
          ? 'Your bank may still be processing the payment. Check again in a moment before trying another payment.'
          : reason}
      </p>

      <div className="w-full max-w-[320px] mt-5 space-y-2">
        <button onClick={verify} className="uk-btn">
          <RefreshCw className="w-4 h-4" /> Check again
        </button>

        {state === 'failed' && orderId && (
          <button onClick={payAgain} disabled={retrying} className="uk-btn-outline">
            {retrying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Opening Paystack…
              </>
            ) : (
              <>Try payment again</>
            )}
          </button>
        )}

        {orderId && (
          <Link to={`/orders/${orderId}`} className="uk-btn-outline">
            View order
          </Link>
        )}
        <Link to="/cart" className="block text-xs font-semibold text-muted-foreground py-2">
          Back to cart
        </Link>
      </div>

      {state === 'failed' && (
        <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-retail" />
          Your cart is untouched and your order is saved.
        </p>
      )}
    </div>
  );
}