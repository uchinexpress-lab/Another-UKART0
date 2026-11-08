import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { Loader2 } from 'lucide-react';

// Returns the customer from Paystack. A confirmed payment goes to the order
// success page; anything else simply returns to the cart with the items still
// there — the unpaid order is closed as abandoned, with no retry prompt.
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const reference = params.get('reference') || params.get('trxref');

  useEffect(() => {
    let active = true;

    const forgetPending = () => {
      try {
        sessionStorage.removeItem('ukart_pending_order');
      } catch {}
    };

    (async () => {
      let pendingOrderId = null;
      try {
        pendingOrderId = sessionStorage.getItem('ukart_pending_order');
      } catch {}

      if (reference) {
        try {
          const res = await base44.functions.invoke('verifyPaystackPayment', { reference });
          if (res.data?.ok) {
            let ord = null;
            try {
              const payments = await base44.entities.Payment.filter({ reference }, { limit: 1 });
              const pmt = payments.items?.[0];
              if (pmt?.order_id) ord = await base44.entities.Order.get(pmt.order_id);
            } catch {}

            clearCart();
            forgetPending();
            if (!active) return;
            navigate(ord ? `/orders/${ord.id}/payment-success` : '/orders', { replace: true });
            return;
          }
        } catch {}
      }

      // Not paid: close the unfinished order and go back to the cart.
      try {
        await base44.functions.invoke('abandonCheckout', {
          orderId: pendingOrderId || undefined,
          reference: reference || undefined,
        });
      } catch {}
      forgetPending();
      if (active) navigate('/cart', { replace: true });
    })();

    return () => {
      active = false;
    };
  }, [reference]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-retail mb-3" />
      <p className="text-[15px] font-bold text-foreground">Verifying your payment…</p>
      <p className="uk-sub mt-1">Please wait while we confirm your transaction.</p>
    </div>
  );
}