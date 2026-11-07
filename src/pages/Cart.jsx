import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();
  const deliveryFee = total > 0 ? 1500 : 0;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ShoppingBag className="w-9 h-9 text-[#2E7D32]" />
        </div>
        <h2 className="uk-title mb-1">Your cart is empty</h2>
        <p className="uk-sub mb-5">Start shopping and add items to your cart</p>
        <Link to="/" className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-xl">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="uk-page pb-40">
      <div className="flex items-center justify-between mb-3">
        <h1 className="uk-title">My Cart</h1>
        <span className="uk-meta">
          {itemCount} item{itemCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="rounded-xl bg-secondary px-3.5 py-2.5 mb-4 flex items-center gap-2">
        <span className="text-[13px] font-medium text-[#2E7D32]">
          Fresh picks reserved in your cart — checkout to lock them in.
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.id} className="uk-card p-3 flex items-start gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
              <Image src={item.image} alt={item.name} className="w-16 h-16" fittingType="fill" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-semibold text-foreground truncate">{item.name}</h3>
              <p className="text-[11px] text-muted-foreground">
                {item.unit || '1 pack'}
                {item.details ? ` · ${item.details}` : ''}
              </p>
              {item.addons && item.addons.length > 0 && (
                <p className="text-[11px] text-muted-foreground truncate">
                  + {item.addons.map((a) => a.name).join(', ')}
                </p>
              )}
              <p className="text-[15px] font-bold text-foreground mt-1">
                ₦{((item.price + (item.addons_total || 0)) * item.quantity).toLocaleString()}
              </p>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="w-9 h-8 flex items-center justify-center text-foreground active:bg-muted"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-[13px] font-bold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                    className="w-9 h-8 flex items-center justify-center text-white bg-[#2E7D32] active:opacity-80"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove item"
                  className="w-10 h-9 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="uk-card p-4 mt-4">
        <p className="uk-section-label mb-2.5">Bill details</p>
        <div className="space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">₦{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Delivery fee</span>
            <span className="font-semibold text-foreground">
              {deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
            </span>
          </div>
          <div className="flex justify-between pt-2.5 border-t border-border">
            <span className="text-[14px] font-bold text-foreground">Total payable</span>
            <span className="text-[17px] font-bold text-[#2E7D32]">
              ₦{(total + deliveryFee).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div
        className="fixed left-0 right-0 max-w-md mx-auto px-4 pt-3 bg-card border-t border-border"
        style={{ bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <button onClick={() => navigate('/checkout')} className="uk-btn">
          Proceed to Checkout <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}