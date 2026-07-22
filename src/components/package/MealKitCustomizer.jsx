import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getProteinOptions, getExtraOptions, PROTEIN_QUANTITIES } from '@/lib/mealKitOptions';

export default function MealKitCustomizer({ pkg }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const proteins = getProteinOptions(pkg);
  const extras = getExtraOptions(pkg);

  const [protein, setProtein] = useState(null);
  const [proteinQty, setProteinQty] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState([]);

  const proteinCost = protein ? protein.price * proteinQty : 0;
  const extrasCost = selectedExtras.reduce((s, e) => s + e.price, 0);
  const total = (pkg.total_price || 0) + proteinCost + extrasCost;

  const toggleExtra = (extra) => {
    setSelectedExtras((prev) =>
      prev.find((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  };

  const handleAdd = () => {
    const parts = [];
    if (protein) parts.push(`${protein.name} (${proteinQty}kg)`);
    if (selectedExtras.length) parts.push(selectedExtras.map((e) => e.name).join(', '));
    const details = parts.join(' · ');
    const extrasHash = selectedExtras.map((e) => e.name).sort().join('+');
    const id = `mealkit-${pkg.id}-${protein ? protein.name : 'none'}-${protein ? proteinQty : 0}-${extrasHash}`;
    addItem({
      id,
      name: pkg.name,
      price: total,
      image: pkg.image,
      unit: pkg.serves || `${pkg.item_count} items`,
      details,
    });
    navigate('/cart');
  };

  const rowClass = (selected) =>
    `w-full flex items-center justify-between p-3 rounded-2xl border transition-colors ${
      selected ? 'border-[#2E7D32] bg-[#E8F5E9]' : 'border-gray-100 bg-white'
    }`;
  const radioClass = (selected) =>
    `w-5 h-5 rounded-full border-2 flex items-center justify-center ${
      selected ? 'border-[#2E7D32] bg-[#2E7D32]' : 'border-gray-300'
    }`;
  const checkClass = (selected) =>
    `w-5 h-5 rounded-md border-2 flex items-center justify-center ${
      selected ? 'border-[#2E7D32] bg-[#2E7D32]' : 'border-gray-300'
    }`;

  return (
    <>
      {pkg.items?.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">What's Included</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {pkg.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </div>
                <span className="text-sm text-gray-500">{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-gray-900">🍗 Add Your Preferred Protein (Optional)</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-3">
          Already have protein at home? Leave this unselected. You can always add it later.
        </p>
        <div className="space-y-2">
          <button onClick={() => setProtein(null)} className={rowClass(protein === null)}>
            <span className="flex items-center gap-3">
              <span className={radioClass(protein === null)}>
                {protein === null && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              <span className="text-sm font-medium text-gray-900">✅ No Protein Included</span>
            </span>
            <span className="text-xs text-gray-400">Included</span>
          </button>
          {proteins.map((p) => {
            const selected = protein?.name === p.name;
            return (
              <button key={p.name} onClick={() => setProtein(p)} className={rowClass(selected)}>
                <span className="flex items-center gap-3">
                  <span className={radioClass(selected)}>
                    {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{p.name}</span>
                </span>
                <span className="text-sm font-bold text-[#2E7D32]">
                  +₦{p.price.toLocaleString()}
                  <span className="text-xs font-normal text-gray-400">/kg</span>
                </span>
              </button>
            );
          })}
        </div>

        {protein && (
          <div className="mt-3">
            <span className="text-xs font-semibold text-gray-600 mb-1.5 block">Protein Quantity</span>
            <div className="flex gap-2">
              {PROTEIN_QUANTITIES.map((q) => (
                <button
                  key={q}
                  onClick={() => setProteinQty(q)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    proteinQty === q
                      ? 'border-[#2E7D32] bg-[#2E7D32] text-white'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  {q}kg
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Complete Your Meal</h2>
        <div className="space-y-2">
          {extras.map((extra) => {
            const selected = !!selectedExtras.find((e) => e.name === extra.name);
            return (
              <button key={extra.name} onClick={() => toggleExtra(extra)} className={rowClass(selected)}>
                <span className="flex items-center gap-3">
                  <span className={checkClass(selected)}>
                    {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{extra.name}</span>
                </span>
                <span className="text-sm font-bold text-[#2E7D32]">
                  +₦{extra.price.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Your Package Total</span>
          <span className="text-xl font-bold text-[#2E7D32]">₦{total.toLocaleString()}</span>
        </div>
        <button
          onClick={handleAdd}
          className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20]"
        >
          <ShoppingBag className="w-4 h-4" /> Add Package to Cart
        </button>
      </div>
    </>
  );
}