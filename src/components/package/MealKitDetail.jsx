import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Users,
  Leaf,
  ChefHat,
  Check,
  ChevronRight,
  ShoppingBag,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useMealKit } from '@/context/MealKitContext';
import MealKitImage from './MealKitImage';
import CookingInstructionsSheet from './CookingInstructionsSheet';

export default function MealKitDetail({ pkg }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const { getSelections, removeSelection, clearSelections } = useMealKit();

  const [optCategories, setOptCategories] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);

  const selections = getSelections(pkg.id);
  const wished = isWishlisted(pkg.id);

  useEffect(() => {
    if (!pkg.optional_categories?.length) {
      setOptCategories([]);
      return;
    }
    base44.entities.Category.list().then((cats) => {
      const filtered = (pkg.optional_categories || [])
        .map((id) => cats.find((c) => c.id === id))
        .filter(Boolean);
      setOptCategories(filtered);
    });
  }, [pkg]);

  const addOnsTotal = selections.reduce(
    (sum, s) => sum + s.price * s.quantity,
    0
  );
  const total = (pkg.total_price || 0) + addOnsTotal;

  const handleAddToCart = () => {
    const addOnDetails = selections
      .map((s) => `${s.name} (${s.quantity}${s.unit ? ' ' + s.unit : ''})`)
      .join(', ');
    addItem({
      id: `mealkit-${pkg.id}`,
      name: pkg.name,
      price: total,
      image: pkg.image,
      unit: pkg.serves || 'Meal Kit',
      details: selections.length ? `Add-ons: ${addOnDetails}` : '',
    });
    clearSelections(pkg.id);
    navigate('/cart');
  };

  return (
    <div className="pb-40">
      {/* Hero product image */}
      <div className="relative w-full h-80 overflow-hidden rounded-b-3xl bg-[#E8F5E9]">
        {pkg.image ? (
          <MealKitImage
            src={pkg.image}
            alt={pkg.name}
            fittingType="fill"
            className="block w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <ShoppingBag className="w-12 h-12 text-[#2E7D32]/40" />
            <span className="text-xs text-gray-400">Package image coming soon</span>
          </div>
        )}
        {/* Favourite */}
        <button
          onClick={() =>
            toggleItem({
              id: pkg.id,
              name: pkg.name,
              price: pkg.total_price,
              image: pkg.image,
              unit: pkg.serves || 'Meal Kit',
            })
          }
          className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          aria-label="Favourite"
        >
          <Heart
            className={`w-5 h-5 ${
              wished ? 'fill-[#2E7D32] text-[#2E7D32]' : 'text-gray-400'
            }`}
          />
        </button>
        {/* Serves badge */}
        {pkg.serves && (
          <span className="absolute top-3 right-3 bg-white/95 text-[#2E7D32] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            {pkg.serves}
          </span>
        )}
      </div>

      {/* Product information */}
      <div className="px-4 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{pkg.name}</h1>
        <p className="text-sm text-gray-500 leading-relaxed mt-1">{pkg.description}</p>

        {/* Info bar */}
        <div className="flex items-stretch mt-3 bg-[#F0F7F0] rounded-2xl py-3">
          <div className="flex-1 flex flex-col items-center gap-1 px-1 text-center">
            <Users className="w-4 h-4 text-[#2E7D32]" />
            <span className="text-[10px] font-semibold text-gray-700 leading-tight">
              {pkg.serves || 'Serves 4-6'}
            </span>
          </div>
          <div className="w-px bg-gray-200 my-1" />
          <div className="flex-1 flex flex-col items-center gap-1 px-1 text-center">
            <Leaf className="w-4 h-4 text-[#2E7D32]" />
            <span className="text-[10px] font-semibold text-gray-700 leading-tight">
              Fresh ingredients
            </span>
          </div>
          <div className="w-px bg-gray-200 my-1" />
          <div className="flex-1 flex flex-col items-center gap-1 px-1 text-center">
            <ChefHat className="w-4 h-4 text-[#2E7D32]" />
            <span className="text-[10px] font-semibold text-gray-700 leading-tight">
              Cooking guide included
            </span>
          </div>
        </div>
      </div>

      {/* What's included */}
      {pkg.items?.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">What's Included</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {pkg.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-4">
                <span className="w-5 h-5 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-[#2E7D32]" strokeWidth={3} />
                </span>
                <span className="text-sm font-medium text-gray-900 flex-1">
                  {item.name}
                </span>
                {item.quantity && (
                  <span className="text-xs text-gray-400">
                    {item.quantity}
                    {item.unit ? ` ${item.unit}` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add optional items */}
      {optCategories.length > 0 && (
        <div className="px-4 mt-6">
          <div className="bg-[#E8F5E9] rounded-2xl p-4">
            <h2 className="text-base font-bold text-[#1B5E20]">Add Optional Items</h2>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">Select any (optional)</p>
            <div className="space-y-2">
              {optCategories.map((cat) => {
                const chosen = selections.find((s) => s.category_id === cat.id);
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between bg-white rounded-xl px-3.5 py-3"
                  >
                    <span className="text-sm font-semibold text-gray-900">
                      {cat.icon} {cat.name}
                    </span>
                    <button
                      onClick={() => navigate(`/category/${cat.id}?kit=${pkg.id}`)}
                      className="flex items-center gap-0.5 text-xs font-bold text-[#2E7D32] active:scale-95 transition-transform"
                    >
                      {chosen ? 'Add more' : 'Choose'}{' '}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Added to kit */}
      {selections.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Added to Kit</h2>
          <div className="space-y-2">
            {selections.map((sel) => (
              <div
                key={sel.id}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3"
              >
                <span className="w-6 h-6 rounded-full bg-[#2E7D32] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 block truncate">
                    {sel.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {sel.quantity}
                    {sel.unit ? ` ${sel.unit}` : ''} — ₦
                    {(sel.price * sel.quantity).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() =>
                    navigate(`/category/${sel.category_id}?kit=${pkg.id}`)
                  }
                  className="text-xs font-semibold text-[#2E7D32] px-2 py-1"
                >
                  Change
                </button>
                <button
                  onClick={() => removeSelection(pkg.id, sel.id)}
                  className="text-xs font-semibold text-red-500 px-2 py-1"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky bottom CTA + total */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 py-3 bg-white border-t border-gray-100 z-30">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs text-gray-400 block leading-none mb-0.5">
              Meal Kit
            </span>
            <span className="text-xl font-bold text-[#2E7D32]">
              ₦{total.toLocaleString()}
            </span>
          </div>
          {selections.length > 0 && (
            <span className="text-xs text-gray-400 text-right">
              Kit ₦{(pkg.total_price || 0).toLocaleString()}
              <br />
              + Add-ons ₦{addOnsTotal.toLocaleString()}
            </span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <ShoppingBag className="w-4 h-4" /> Add to Cart
        </button>
      </div>

      <CookingInstructionsSheet
        open={showInstructions}
        onOpenChange={setShowInstructions}
      />
    </div>
  );
}