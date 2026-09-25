import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();
  const deliveryFee = total > 0 ? (total > 30000 ? 0 : 1500) : 0;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-[#2E7D32]" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mb-4">Start shopping and add items to your cart</p>
        <Link to="/" className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 pb-40">
      <h1 className="text-2xl font-bold text-foreground mb-4">Your Cart ({items.length})</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3">
            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
              <span className="text-xs text-gray-400">{item.unit}</span>
              {item.details && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{item.details}</p>
              )}
              <div className="text-sm font-bold text-[#2E7D32]">
                ₦{(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-11 h-11 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-11 h-11 rounded-full bg-[#2E7D32] flex items-center justify-center active:scale-90 transition-transform"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <button onClick={() => removeItem(item.id)} className="p-1">
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-card rounded-2xl border border-border p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">₦{total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery Fee</span>
          <span className="font-semibold">
            {deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
          </span>
        </div>
        {deliveryFee === 0 && (
          <p className="text-xs text-[#2E7D32] font-medium">🎉 You qualified for free delivery!</p>
        )}
        <div className="flex justify-between pt-2 border-t border-border">
          <span className="font-bold">Total</span>
          <span className="font-bold text-[#2E7D32] text-lg">
            ₦{(total + deliveryFee).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 py-3 bg-card border-t border-border">
        <button
          onClick={() => navigate('/checkout')}
          className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20]"
        >
          Proceed to Checkout <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}