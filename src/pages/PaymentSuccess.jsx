import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function PaymentSuccess() {
  const { id } = useParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let active = true;
    base44.entities.Order
      .get(id)
      .then((o) => {
        if (!active) return;
        setOrder(o);
        if (o?.payment_status === 'Paid') clearCart();
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const payNow = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const res = await base44.functions.invoke('initiatePaystackPayment', {
        orderId: order.id,
        callbackUrl,
      });
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        setPaying(false);
      }
    } catch {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 px-6">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Link to="/orders" className="text-[#2E7D32] text-sm font-medium mt-2 inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  const paid = order.payment_status === 'Paid';

  if (!paid) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {order.payment_status === 'Failed' ? 'Payment Failed' : 'Payment Not Confirmed'}
        </h2>
        <p className="text-sm text-muted-foreground mb-1">
          Order {order.order_number} has not been paid for.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Your payment was not completed. Your order has not been confirmed.
        </p>
        <button
          onClick={payNow}
          disabled={paying}
          className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full mb-3 flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {order.payment_status === 'Failed' ? 'Retry Payment' : 'Pay Now'}
        </button>
        <Link to="/orders" className="text-[#2E7D32] text-sm font-medium px-6 py-3">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
      <div className="w-20 h-20 rounded-full bg-[#2E7D32]/10 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-12 h-12 text-[#2E7D32]" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-1">Payment Successful</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your order #{order.order_number} has been confirmed and is now being processed.
      </p>

      <div className="bg-card rounded-2xl border border-border p-4 mb-6 w-full max-w-sm text-left space-y-2">
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
            Confirmed{order.payment_channel ? ` · ${order.payment_channel}` : ''}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium text-[#2E7D32]">Processing</span>
        </div>
      </div>

      <Link
        to={`/orders/${order.id}`}
        className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full active:scale-95 transition-transform"
      >
        View Order
      </Link>
    </div>
  );
}