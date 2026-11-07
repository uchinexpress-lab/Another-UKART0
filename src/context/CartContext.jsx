import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ukart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('ukart_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast({ title: 'Added to cart', description: product.name || 'Item added' });
  };

  const addItems = (products) => {
    setItems((prev) => {
      let next = [...prev];
      for (const product of products) {
        const id = product.id || product.name;
        const existing = next.find((i) => i.id === id);
        if (existing) {
          next = next.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + (product.quantity || 1) } : i
          );
        } else {
          next = [...next, { ...product, id, quantity: product.quantity || 1 }];
        }
      }
      return next;
    });
    toast({
      title: 'Added to cart',
      description: `${products.length} item${products.length === 1 ? '' : 's'} added`,
    });
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id, qty) => {
    if (qty <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + (i.price + (i.addons_total || 0)) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, addItems, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}