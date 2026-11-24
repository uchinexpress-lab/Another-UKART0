
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { Loader2, AlertCircle } from 'lucide-react';

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const reference = params.get('reference') || params.get('trxref');

  const [state, setState] = useState('verifying');
  const [message, setMessage] = useState(
    'Please wait while we confirm your transaction with Paystack.'
  );

  const verify = useCallback(async () => {
    if (!reference) {
      setState('error');
      setMessage(
        'We could not find a payment reference. Your cart has not been cleared.'
      );
      return;
    }

    setState('verifying');

    try {
      const result = await base44.functions.invoke(
        'process-paystack-payment',
        {
          action: 'verify',
          reference,
        }
      );

      if (result?.ok && result?.orderId) {
        clearCart();

        try {
          sessionStorage.removeItem('ukart_pending_order');
        } catch {}

        navigate(
          `/orders/${result.orderId}/payment-success`,
          { replace: true }
        );
        return;
      }

      setState('error');
      setMessage(
        result?.error ||
          'Payment has not been confirmed yet. Your cart is still saved. Please return to checkout or contact support if your account was debited.'
      );
    } catch (error) {
      setState('error');
      setMessage(
        error?.message ||
          'We could not reach the payment service. Your cart is still saved. If you were debited, please contact support before paying again.'
      );
    }
  }, [reference, clearCart, navigate]);

  useEffect(() => {
    verify();
  }, [verify]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      {state === 'verifying' ? (
        <Loader2 className="w-8 h-8 animate-spin text-retail mb-3" />
      ) : (
        <AlertCircle className="w-10 h-10 text-amber-600 mb-3" />
      )}

      <h2 className="text-lg font-bold text-foreground">
        {state === 'verifying'
          ? 'Verifying your payment…'
          : 'Payment confirmation needed'}
      </h2>

      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        {message}
      </p>

      {state !== 'verifying' && (
        <div className="flex gap-3 mt-5">
          <button
            onClick={verify}
            className="rounded-full bg-retail text-white px-5 py-2.5 text-sm font-bold"
          >
            Check payment again
          </button>

          <Link
            to="/cart"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-bold"
          >
            Return to cart
          </Link>
        </div>
      )}
    </div>
  );
}