import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Users, ChevronRight, ChefHat, ShoppingBag, BookOpen } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getProteinOptions } from '@/lib/mealKitOptions';
import { Image } from '@/components/ui/image';
import { Switch } from '@/components/ui/switch';
import CookingInstructionsSheet from './CookingInstructionsSheet';

const RECIPE_CARD_PRICE = 100;

export default function MealKitDetail({ pkg }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const proteins = getProteinOptions(pkg);

  const [protein, setProtein] = useState(null);
  const [recipeCard, setRecipeCard] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const proteinCost = protein ? protein.price : 0;
  const total =
    (pkg.total_price || 0) + proteinCost + (recipeCard ? RECIPE_CARD_PRICE : 0);

  const handleAdd = () => {
    const parts = [];
    if (protein) parts.push(`${protein.name} (1kg)`);
    if (recipeCard) parts.push('Physical Recipe Card');
    const details = parts.join(' · ');
    const id = `mealkit-${pkg.id}-${protein ? protein.name : 'none'}-${
      recipeCard ? 'rc' : 'norc'
    }`;
    addItem({
      id,
      name: pkg.name,
      price: total,
      image: pkg.image,
      unit: pkg.serves || `${pkg.item_count || 0} items`,
      details,
    });
    navigate('/cart');
  };

  const rowClass = (selected) =>
    `w-full flex items-center justify-between p-3.5 rounded-2xl border transition-colors text-left ${
      selected ? 'border-[#2E7D32] bg-[#F0F7F0]' : 'border-gray-100 bg-white'
    }`;
  const checkboxClass = (selected) =>
    `w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
      selected ? 'border-[#2E7D32] bg-[#2E7D32]' : 'border-gray-300'
    }`;

  return (
    <div className="pb-40">
      {/* Hero food image */}
      <div className="relative w-full h-80 overflow-hidden rounded-b-3xl bg-muted">
        <Image
          src={pkg.image}
          alt={pkg.name}
          fittingType="fill"
          className="block w-full h-full"
        />
      </div>

      {/* Package information card */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
              {pkg.badge || 'Meal Kit'}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" /> {pkg.delivery_time || '25–40 mins'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5 leading-tight">
            {pkg.name}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">{pkg.description}</p>
          {pkg.serves && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-full mb-4">
              <Users className="w-3.5 h-3.5" /> {pkg.serves}
            </div>
          )}
          <div className="flex items-end justify-between pt-3 border-t border-gray-50">
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Base Kit Price</span>
              <span className="text-3xl font-bold text-[#2E7D32]">
                ₦{pkg.total_price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional protein section */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-gray-900">
          Choose your protein <span className="text-gray-400 font-normal">(optional)</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-3">Add a protein to your meal kit.</p>
        <div className="space-y-2">
          <button onClick={() => setProtein(null)} className={rowClass(protein === null)}>
            <span className="text-sm font-medium text-gray-900">No protein</span>
            <span className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Included</span>
              <span className={checkboxClass(protein === null)}>
                {protein === null && (
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                )}
              </span>
            </span>
          </button>
          {proteins.map((p) => {
            const selected = protein?.name === p.name;
            return (
              <button
                key={p.name}
                onClick={() => setProtein(p)}
                className={rowClass(selected)}
              >
                <span className="text-sm font-medium text-gray-900">{p.name} (1kg)</span>
                <span className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#2E7D32]">
                    ₦{p.price.toLocaleString()}
                  </span>
                  <span className={checkboxClass(selected)}>
                    {selected && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* What's included */}
      {pkg.items?.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-base font-bold text-gray-900">
            What's included in the meal kit?
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-3">
            Pre-measured, fresh ingredients for easy cooking.
          </p>
          <div className="bg-white rounded-2xl border border-gray-50 divide-y divide-gray-50">
            {pkg.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-4">
                <span className="w-5 h-5 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-[#2E7D32]" strokeWidth={3} />
                </span>
                <span className="text-sm font-medium text-gray-900 flex-1">
                  {item.name}
                </span>
                {item.quantity && (
                  <span className="text-xs text-gray-400">{item.quantity}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cooking instructions */}
      <div className="px-4 mt-6">
        <button
          onClick={() => setShowInstructions(true)}
          className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-50 p-4 active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-[#2E7D32]" />
            </span>
            <span className="text-sm font-bold text-gray-900">Cooking Instructions</span>
          </span>
          <span className="flex items-center gap-0.5 text-xs font-semibold text-[#2E7D32]">
            View <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>

      {/* Physical recipe card */}
      <div className="px-4 mt-4">
        <div className="bg-[#F0F7F0] border border-[#D6F0DD] rounded-2xl p-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-3 flex-1 min-w-0">
            <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-[#2E7D32]" />
            </span>
            <span className="min-w-0">
              <span className="text-sm font-bold text-gray-900 block">
                Get a physical recipe card
              </span>
              <span className="text-xs text-gray-500 block">
                Receive a printed step-by-step recipe card with your order.
              </span>
              <span className="text-sm font-bold text-[#2E7D32] mt-0.5 block">
                ₦{RECIPE_CARD_PRICE}
              </span>
            </span>
          </span>
          <Switch checked={recipeCard} onCheckedChange={setRecipeCard} />
        </div>
      </div>

      {/* Fixed bottom CTA + total */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 py-3 bg-white border-t border-gray-100 z-30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Your Package Total</span>
          <span className="text-xl font-bold text-[#2E7D32]">
            ₦{total.toLocaleString()}
          </span>
        </div>
        <button
          onClick={handleAdd}
          className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <ShoppingBag className="w-4 h-4" /> Add Package to Cart
        </button>
      </div>

      <CookingInstructionsSheet
        open={showInstructions}
        onOpenChange={setShowInstructions}
      />
    </div>
  );
}