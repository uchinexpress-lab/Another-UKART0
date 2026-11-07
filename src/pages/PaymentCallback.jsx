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
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#2E7D32] mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-1">Verifying your payment…</h2>
        <p className="text-sm text-muted-foreground">Please wait while we confirm your transaction.</p>
      </div>
    );
  }

  // --- Success (fallback if the order could not be loaded) ---
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
        <div className="w-20 h-20 rounded-full bg-[#2E7D32]/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-[#2E7D32]" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Payment Successful</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your order has been confirmed and is now being processed.
        </p>
        <Link
          to="/orders"
          className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full active:scale-95 transition-transform"
        >
          View Order
        </Link>
      </div>
    );
  }

  // --- Failed / abandoned ---
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <XCircle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-1">Payment Failed</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your payment was not completed. Your order has not been confirmed.
      </p>

      <button
        onClick={tryAgain}
        disabled={retrying || !order}
        className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full mb-3 flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
      >
        {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Try Payment Again
      </button>
      <Link to="/orders" className="text-[#2E7D32] text-sm font-medium px-6 py-3">
        Back to My Orders
      </Link>
    </div>
  );
}