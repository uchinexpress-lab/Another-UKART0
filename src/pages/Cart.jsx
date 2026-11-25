
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Bike } from 'lucide-react';
import { Image } from '@/components/ui/image';

const MINIMUM_ORDER = 5000;

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const meetsMinimum = total >= MINIMUM_ORDER;
  const remaining = Math.max(0, MINIMUM_ORDER - total);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
          <ShoppingBag className="w-8 h-8 text-retail" />
        </div>
        <h2 className="uk-title mb-1">Your cart is empty</h2>
        <p className="uk-sub mb-5">Start shopping and add items to your cart</p>
        <Link to="/" className="uk-btn w-auto px-6">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="uk-page pb-32">
      <div className="flex items-center justify-end mb-2">
        <span className="uk-meta-chip text-[10px] py-1 px-2">
          {itemCount} item{itemCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="uk-banner mb-2 py-1.5 px-2.5 text-[11px]">
        <Bike className="w-3.5 h-3.5 shrink-0" />
        <span>Island delivery target: ~30 mins. Mainland: same-day. Times vary with traffic &amp; order volume.</span>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="uk-card !p-2 flex items-center gap-2"
          >
            <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image
                src={item.image}
                alt={item.name}
                className="w-11 h-11"
                fittingType="fill"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[11px] leading-tight font-semibold text-foreground truncate">
                    {item.name}
                  </h3>
                  <p className="text-[9px] leading-tight text-muted-foreground mt-0.5">
                    {item.unit || '1 pack'}
                    {item.details ? ` · ${item.details}` : ''}
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove item"
                  className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>

              {item.addons && item.addons.length > 0 && (
                <p className="text-[9px] leading-tight text-muted-foreground truncate mt-0.5">
                  + {item.addons.map((a) => a.name).join(', ')}
                </p>
              )}

              <div className="flex items-center justify-between mt-1">
                <p className="text-[12px] leading-none font-bold text-foreground">
                  ₦{((item.price + (item.addons_total || 0)) * item.quantity).toLocaleString()}
                </p>

                <div className="uk-qty scale-90 origin-right">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="uk-qty-btn"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-6 text-center text-[11px] font-bold text-foreground">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                    className="uk-qty-btn bg-retail text-retail-foreground"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="uk-card !p-3 mt-2.5">
        <p className="uk-section-label text-[10px] mb-1.5">
          Bill details
        </p>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Items total</span>
            <span className="font-semibold text-foreground">
              ₦{total.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between pt-1.5 border-t border-border">
            <span className="text-xs font-bold text-foreground">Total</span>
            <span className="text-sm font-bold text-retail">
              ₦{total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {!meetsMinimum && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-900">
            Minimum order: ₦5,000
          </p>
          <p className="text-[10px] text-amber-800 mt-0.5">
            Add ₦{remaining.toLocaleString()} more to your cart to proceed to checkout.
          </p>
          <div className="w-full h-1.5 rounded-full bg-amber-200 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-600 transition-all"
              style={{ width: `${Math.min(100, (total / MINIMUM_ORDER) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div
        className="uk-cta"
        style={{
          bottom: 0,
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)'
        }}
      >
        <button
          onClick={() => navigate('/checkout')}
          disabled={!meetsMinimum}
          className="uk-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {meetsMinimum ? 'Proceed to Checkout' : `Add ₦${remaining.toLocaleString()} more`}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}