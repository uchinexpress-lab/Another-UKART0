import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { Loader2, CheckCircle2, XCircle, Truck, MapPin, Clock, RefreshCw } from 'lucide-react';

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const reference = params.get('reference') || params.get('trxref');
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      return;
    }
    (async () => {
      try {
        // Ask the backend to verify the transaction with Paystack
        const res = await base44.functions.invoke('verifyPaystackPayment', { reference });
        const data = res.data;

        // Load the payment + order for display
        try {
          const payments = await base44.entities.Payment.filter({ reference }, { limit: 1 });
          if (payments.items?.length) {
            setPayment(payments.items[0]);
            const ord = await base44.entities.Order.get(payments.items[0].order_id);
            setOrder(ord);
          }
        } catch {}

        if (data.ok) {
          setStatus('success');
          clearCart();
        } else {
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

  // --- Success ---
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
        <div className="w-20 h-20 rounded-full bg-[#2E7D32]/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-[#2E7D32]" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">✓ Payment Successful</h2>
        <p className="text-sm text-muted-foreground mb-1">Your Ukart order has been confirmed.</p>

        {order && (
          <div className="bg-card rounded-2xl border border-border p-4 mt-4 mb-6 w-full max-w-sm text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order</span>
              <span className="font-bold text-foreground">{order.order_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-bold text-[#2E7D32]">₦{(order.total || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium text-foreground">
                Paystack{payment?.payment_channel ? ` · ${payment.payment_channel}` : ''}
              </span>
            </div>
            {order.customer_address && (
              <div className="flex items-start gap-1.5 text-sm pt-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{order.customer_address}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm pt-1">
              <Clock className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span className="text-[#2E7D32] font-medium">Estimated delivery: 30-60 min</span>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate(order ? `/track?id=${order.id}` : '/orders')}
          className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full mb-3 flex items-center gap-2 active:scale-95 transition-transform"
        >
          <Truck className="w-4 h-4" /> Track My Order
        </button>
        <Link to="/orders" className="text-[#2E7D32] text-sm font-medium px-6 py-3">
          View My Orders
        </Link>
      </div>
    );
  }

  // --- Failed ---
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <XCircle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-1">Payment was not completed</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {order ? `Order ${order.order_number} — your payment could not be verified.` : 'Your payment could not be verified.'}
      </p>

      <button
        onClick={tryAgain}
        disabled={retrying || !order}
        className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full mb-3 flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
      >
        {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Try Again
      </button>
      <Link to="/cart" className="text-[#2E7D32] text-sm font-medium px-6 py-3">
        Return to Checkout
      </Link>
    </div>
  );
}