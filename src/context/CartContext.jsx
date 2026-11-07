import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
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

  const addItem = useCallback((product) => {
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
  }, []);

  const addItems = useCallback((products) => {
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
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id, qty) => {
      if (qty <= 0) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  // Cart totals are derived once per change instead of on every render.
  const { total, itemCount } = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (const i of items) {
      sum += (i.price + (i.addons_total || 0)) * i.quantity;
      count += i.quantity;
    }
    return { total: sum, itemCount: count };
  }, [items]);

  // Stable context value: consumers only re-render when the cart changes,
  // not on every provider render (which was making every page feel sluggish).
  const value = useMemo(
    () => ({ items, addItem, addItems, removeItem, updateQuantity, clearCart, total, itemCount }),
    [items, addItem, addItems, removeItem, updateQuantity, clearCart, total, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}