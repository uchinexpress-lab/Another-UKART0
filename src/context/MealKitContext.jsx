import React, { createContext, useContext, useState, useEffect } from 'react';

const MealKitContext = createContext();
export const useMealKit = () => useContext(MealKitContext);

const STORAGE_KEY = 'ukart_kit_selections';

// Selections shape: { [kitId]: [{ id, name, price, image, unit, quantity, category_id, category_name }] }
export function MealKitProvider({ children }) {
  const [selections, setSelections] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  }, [selections]);

  const getSelections = (kitId) => selections[kitId] || [];

  const addSelection = (kitId, product, quantity = 1) => {
    setSelections((prev) => {
      const existing = prev[kitId] || [];
      const found = existing.find((s) => s.id === product.id);
      let updated;
      const entry = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit,
        category_id: product.category_id,
        category_name: product.category_name,
      };
      if (found) {
        updated = existing.map((s) =>
          s.id === product.id ? { ...s, quantity: s.quantity + quantity } : s
        );
      } else {
        updated = [...existing, { ...entry, quantity }];
      }
      return { ...prev, [kitId]: updated };
    });
  };

  const removeSelection = (kitId, productId) => {
    setSelections((prev) => ({
      ...prev,
      [kitId]: (prev[kitId] || []).filter((s) => s.id !== productId),
    }));
  };

  const clearSelections = (kitId) => {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[kitId];
      return next;
    });
  };

  return (
    <MealKitContext.Provider
      value={{ selections, getSelections, addSelection, removeSelection, clearSelections }}
    >
      {children}
    </MealKitContext.Provider>
  );
}