import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();
export const useWishlist = () => useContext(WishlistContext);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ukart_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('ukart_wishlist', JSON.stringify(items));
  }, [items]);

  const toggleItem = (product) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) return prev.filter((i) => i.id !== product.id);
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, unit: product.unit }];
    });
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const isWishlisted = (id) => items.some((i) => i.id === id);

  const itemCount = items.length;

  return (
    <WishlistContext.Provider value={{ items, toggleItem, removeItem, isWishlisted, itemCount }}>
      {children}
    </WishlistContext.Provider>
  );
}