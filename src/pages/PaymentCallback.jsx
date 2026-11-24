
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/api/supabaseClient';
import { CheckCircle2, XCircle, Loader2, RefreshCw, ShoppingBag } from 'lucide-react';

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Confirming your payment securely...');
  const [reference, setReference] = useState('');
  const [orderId, setOrderId] = useState(null);

  const verificationStarted = useRef(false);

  const verifyPayment = async paymentReference => {
    if (!paymentReference) {
      setStatus('failed');
      setMessage('We could not find your payment reference. Please check your orders or contact support.');
      return;
    }

    setReference(paymentReference);
    setStatus('verifying');
    setMessage('Confirming your payment securely...');

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error('Your session has expired. Please sign in again before verifying this payment.');
      }

      const { data, error } = await supabase.functions.invoke(
        'process-paystack-payment',
        {
          body: {
            action: 'verify',
            reference: paymentReference,
          },
        }
      );

      if (error) {
        let details = null;

        try {
          if (error.context?.json) {
            details = await error.context.json();
          }
        } catch {}

        if (details?.paid === true) {
          setStatus('pending');
          setMessage(
            'Your payment has been confirmed, but order creation needs attention. Please do not pay again. Contact Ukart support with your payment reference.'
          );
          return;
        }

        throw new Error(details?.error || error.message || 'Payment verification failed.');
      }

      if (data?.paid === true && !data?.orderId) {
        setStatus('pending');
        setMessage(
          'Your payment has been confirmed, but your order is still being processed. Please do not pay again. Contact Ukart support with your payment reference.'
        );
        return;
      }

      if (!data?.ok || !data?.orderId) {
        throw new Error(data?.error || 'We could not confirm this payment.');
      }

      setOrderId(data.orderId);
      setStatus('success');
      setMessage('Payment successful. Your order has been confirmed.');

      // Only clear the cart after the server confirms the completed order.
      clearCart();

      setTimeout(() => {
        navigate(`/orders/${data.orderId}/payment-success`, {
          replace: true,
        });
      }, 1800);
    } catch (error) {
      console.error('Ukart payment verification error:', error);

      setStatus('failed');
      setMessage(
        error?.message ||
        'We could not verify your payment. You can try again.'
      );
    }
  };

  useEffect(() => {
    if (verificationStarted.current) return;

    verificationStarted.current = true;

    const paymentReference =
      searchParams.get('reference') ||
      searchParams.get('trxref');

    const paymentStatus = searchParams.get('status');

    if (paymentStatus === 'cancelled' || paymentStatus === 'cancel') {
      setStatus('cancelled');
      setMessage('You cancelled the payment. Your cart has been preserved.');
      return;
    }

    verifyPayment(paymentReference);
  }, [searchParams]);

  const goToOrders = () => {
    navigate('/orders', { replace: true });
  };

  const retryVerification = () => {
    if (reference) verifyPayment(reference);
  };

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-5">
      <div className="uk-card w-full max-w-md p-6 text-center">

        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-8 h-8 text-retail animate-spin" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">
              Verifying Payment
            </h2>

            <p className="text-sm text-muted-foreground">
              {message}
            </p>

            <p className="text-xs text-muted-foreground mt-4">
              Please don't close this page.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">
              Payment Successful!
            </h2>

            <p className="text-sm text-muted-foreground">
              {message}
            </p>

            {orderId && (
              <p className="text-xs text-muted-foreground mt-3">
                Order reference: {orderId}
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              Taking you to your order confirmation...
            </p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-8 h-8 text-amber-600" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">
              Payment Received
            </h2>

            <p className="text-sm text-muted-foreground">
              {message}
            </p>

            {reference && (
              <div className="bg-muted rounded-xl p-3 mt-4 text-left">
                <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">
                  Payment reference
                </p>
                <p className="text-xs font-semibold break-all">
                  {reference}
                </p>
              </div>
            )}

            <button
              onClick={retryVerification}
              className="uk-btn mt-5"
            >
              <RefreshCw className="w-4 h-4" />
              Check Payment Again
            </button>

            <button
              onClick={goToOrders}
              className="w-full text-sm font-semibold text-retail mt-4"
            >
              Go to My Orders
            </button>
          </>
        )}

        {(status === 'failed' || status === 'cancelled') && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-9 h-9 text-red-600" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">
              {status === 'cancelled' ? 'Payment Cancelled' : 'Verification Unsuccessful'}
            </h2>

            <p className="text-sm text-muted-foreground">
              {message}
            </p>

            {reference && (
              <div className="bg-muted rounded-xl p-3 mt-4 text-left">
                <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">
                  Payment reference
                </p>
                <p className="text-xs font-semibold break-all">
                  {reference}
                </p>
              </div>
            )}

            {reference && status === 'failed' && (
              <button
                onClick={retryVerification}
                className="uk-btn mt-5"
              >
                <RefreshCw className="w-4 h-4" />
                Try Verification Again
              </button>
            )}

            <button
              onClick={() => navigate('/cart')}
              className="w-full text-sm font-semibold text-retail mt-4"
            >
              Return to Cart
            </button>

            <button
              onClick={goToOrders}
              className="w-full text-sm text-muted-foreground mt-3"
            >
              View My Orders
            </button>
          </>
        )}

      </div>
    </div>
  );
}