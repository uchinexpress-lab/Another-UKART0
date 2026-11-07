import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Bike } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ShoppingBag className="w-9 h-9 text-retail" />
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
    <div className="uk-page pb-40">
      <div className="flex items-center justify-end mb-3">
        <span className="uk-meta-chip">
          {itemCount} item{itemCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="uk-banner mb-4">
        <Bike className="w-4 h-4 shrink-0" />
        <span>Your order will arrive 45–90 min after placing!</span>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.id} className="uk-card p-3 flex items-start gap-3">
            <div className="w-[68px] h-[68px] rounded-xl overflow-hidden bg-muted shrink-0">
              <Image src={item.image} alt={item.name} className="w-[68px] h-[68px]" fittingType="fill" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-semibold text-foreground truncate">{item.name}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {item.unit || '1 pack'}
                    {item.details ? ` · ${item.details}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove item"
                  className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>

              {item.addons && item.addons.length > 0 && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  + {item.addons.map((a) => a.name).join(', ')}
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <p className="text-[15px] font-bold text-foreground">
                  ₦{((item.price + (item.addons_total || 0)) * item.quantity).toLocaleString()}
                </p>
                <div className="uk-qty">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="uk-qty-btn"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-[13px] font-bold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                    className="uk-qty-btn bg-retail text-retail-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="uk-card p-4 mt-4">
        <p className="uk-section-label mb-2.5">Bill details</p>
        <div className="space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Items total</span>
            <span className="font-semibold text-foreground">₦{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2.5 border-t border-border">
            <span className="text-[14px] font-bold text-foreground">Total</span>
            <span className="text-[17px] font-bold text-retail">
              ₦{total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="uk-cta" style={{ bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        <button onClick={() => navigate('/checkout')} className="uk-btn">
          Proceed to Checkout <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}