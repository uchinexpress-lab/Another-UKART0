
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { Loader2, AlertCircle, Clock, RefreshCw } from 'lucide-react';

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const reference = params.get('reference') || params.get('trxref');

  const [state, setState] = useState('verifying');
  const [reason, setReason] = useState('');

  const verify = useCallback(async () => {
    if (!reference) {
      setState('failed');
      setReason('No payment reference was returned by Paystack.');
      return;
    }

    setState('verifying');
    setReason('');

    try {
      const data = await base44.functions.invoke(
        'process-paystack-payment',
        {
          action: 'verify',
          reference,
        }
      );

      if (data?.ok && data?.orderId) {
        // Only clear the cart after the server confirms payment
        // and successfully creates the order.
        clearCart();

        navigate(
          `/orders/${data.orderId}/payment-success`,
          { replace: true }
        );
        return;
      }

      if (data?.pending) {
        setState('pending');
        setReason(
          'Paystack is still confirming this transaction. Please check again shortly.'
        );
        return;
      }

      // A payment may have succeeded even if order finalization failed.
      // Never ask the customer to pay again in this situation.
      if (data?.paid) {
        setState('error');
        setReason(
          'Your payment appears successful, but we could not finish creating your order. Please contact Ukart support. Do not make another payment.'
        );
        return;
      }

      setState('failed');
      setReason(
        data?.error ||
        data?.reason ||
        'The payment was not completed. Your cart has been kept.'
      );
    } catch (error) {
      console.error('Paystack verification failed:', error);

      setState('error');
      setReason(
        error?.message ||
        'We could not confirm your payment. If your account was debited, please do not pay again. Check again or contact Ukart support.'
      );
    }
  }, [reference, clearCart, navigate]);

  useEffect(() => {
    verify();
  }, [verify]);

  if (state === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-retail mb-3" />
        <p className="text-[15px] font-bold text-foreground">
          Verifying your payment…
        </p>
        <p className="uk-sub mt-1">
          Please wait while we confirm your transaction with Paystack.
        </p>
      </div>
    );
  }

  const Icon = state === 'pending' ? Clock : AlertCircle;

  const iconTone =
    state === 'pending'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-600';

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

      <h2 className="text-lg font-bold text-foreground">
        {title}
      </h2>

      <p className="text-sm text-muted-foreground mt-1.5 max-w-[320px]">
        {reason}
      </p>

      <div className="w-full max-w-[320px] mt-5 space-y-2">
        <button
          onClick={verify}
          className="uk-btn"
        >
          <RefreshCw className="w-4 h-4" />
          Check again
        </button>

        <Link
          to="/cart"
          className="block text-xs font-semibold text-muted-foreground py-2"
        >
          Back to cart
        </Link>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4">
        Your cart will only be cleared after successful payment verification.
      </p>
    </div>
  );
}