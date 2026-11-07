import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const reference = params.get('reference') || params.get('trxref');
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [order, setOrder] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      return;
    }
    (async () => {
      try {
        // The backend re-verifies with Paystack. The URL alone means nothing.
        const res = await base44.functions.invoke('verifyPaystackPayment', { reference });
        const data = res.data;

        let ord = null;
        try {
          const payments = await base44.entities.Payment.filter({ reference }, { limit: 1 });
          const pmt = payments.items?.[0];
          if (pmt?.order_id) ord = await base44.entities.Order.get(pmt.order_id);
        } catch {}

        if (data?.ok) {
          clearCart();
          if (ord) {
            navigate(`/orders/${ord.id}/payment-success`, { replace: true });
            return;
          }
          setStatus('success');
        } else {
          setOrder(ord);
          setStatus('failed');
        }
      } catch {
        setStatus('failed');
      }
    })();
  }, [reference]);

  const tryAgain = async () => {
    if (!order) return;
    setRetrying(true);
    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const res = await base44.functions.invoke('initiatePaystackPayment', {
        orderId: order.id,
        callbackUrl,
      });
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        setRetrying(false);
      }
    } catch {
      setRetrying(false);
    }
  };

  // --- Verifying ---
  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-retail mb-3" />
        <p className="text-[15px] font-bold text-foreground">Verifying your payment…</p>
        <p className="uk-sub mt-1">Please wait while we confirm your transaction.</p>
      </div>
    );
  }

  // --- Success (fallback if the order could not be loaded) ---
  if (status === 'success') {
    return (
      <div className="uk-page min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
          <CheckCircle2 className="w-7 h-7 text-retail" />
        </div>
        <h2 className="uk-title">Payment successful</h2>
        <p className="uk-sub mt-1 mb-5">Your order is confirmed and being processed.</p>
        <Link to="/orders" className="uk-btn">
          View order
        </Link>
      </div>
    );
  }

  // --- Failed / abandoned ---
  return (
    <div className="uk-page min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <XCircle className="w-7 h-7 text-destructive" />
      </div>
      <h2 className="uk-title">Payment failed</h2>
      <p className="uk-sub mt-1">Your payment was not completed, so the order is not confirmed.</p>

      <button
        onClick={tryAgain}
        disabled={retrying || !order}
        className="uk-btn mt-5"
      >
        {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Try payment again
      </button>
      <Link to="/orders" className="uk-btn-outline mt-2.5">
        Back to my orders
      </Link>
    </div>
  );
}