import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { base44 } from '@/api/base44Client';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';

export default function Cart() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const navigate = useNavigate();
  const deliveryFee = total > 0 ? (total > 30000 ? 0 : 1500) : 0;
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [placing, setPlacing] = useState(false);

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || placing) return;
    setPlacing(true);
    try {
      const orderNumber = `UK-${Date.now().toString().slice(-6)}`;
      const orderItems = items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        unit: i.unit,
      }));
      await base44.entities.Order.create({
        order_number: orderNumber,
        items: orderItems,
        subtotal: total,
        delivery_fee: deliveryFee,
        total: total + deliveryFee,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        status: 'new',
      });
      const itemLines = orderItems
        .map((i) => `• ${i.quantity}x ${i.name} — ₦${(i.price * i.quantity).toLocaleString()}`)
        .join('\n');
      const body = `New order received!\n\nOrder: ${orderNumber}\nCustomer: ${customerName}\nPhone: ${customerPhone}\nAddress: ${customerAddress}\n\nItems:\n${itemLines}\n\nSubtotal: ₦${total.toLocaleString()}\nDelivery: ${deliveryFee === 0 ? 'FREE' : '₦' + deliveryFee.toLocaleString()}\nTotal: ₦${(total + deliveryFee).toLocaleString()}`;
      await base44.integrations.Core.SendEmail({
        to: 'ukartfreshventures@gmail.com',
        subject: `🛒 New Order ${orderNumber} — Ukart`,
        body,
      });
      clearCart();
      navigate('/');
    } catch (e) {
      setPlacing(false);
      alert('Could not place order. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-[#2E7D32]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Your cart is empty</h2>
        <p className="text-sm text-gray-500 mb-4">Start shopping and add items to your cart</p>
        <Link to="/" className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 pb-40">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart ({items.length})</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3">
            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
              <span className="text-xs text-gray-400">{item.unit}</span>
              <div className="text-sm font-bold text-[#2E7D32]">
                ₦{(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-full bg-[#2E7D32] flex items-center justify-center"
              >
                <Plus className="w-3 h-3 text-white" />
              </button>
            </div>
            <button onClick={() => removeItem(item.id)} className="p-1">
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold">₦{total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Delivery Fee</span>
          <span className="font-semibold">
            {deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
          </span>
        </div>
        {deliveryFee === 0 && (
          <p className="text-xs text-[#2E7D32] font-medium">🎉 You qualified for free delivery!</p>
        )}
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <span className="font-bold">Total</span>
          <span className="font-bold text-[#2E7D32] text-lg">
            ₦{(total + deliveryFee).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Delivery Details</h3>
        <div className="space-y-2.5">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Full name"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32]"
          />
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Phone number"
            inputMode="tel"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32]"
          />
          <textarea
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Delivery address"
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32] resize-none"
          />
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 py-3 bg-white border-t border-gray-100">
        <button
          onClick={handleCheckout}
          disabled={placing || !customerName.trim() || !customerPhone.trim() || !customerAddress.trim()}
          className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {placing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Placing order...
            </>
          ) : (
            <>
              Checkout ₦{(total + deliveryFee).toLocaleString()} <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}