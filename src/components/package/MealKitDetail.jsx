import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Users,
  Clock,
  ChefHat,
  Check,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useMealKit } from '@/context/MealKitContext';
import ProteinOptionCard from './ProteinOptionCard';
import CookingInstructionsSheet from './CookingInstructionsSheet';

const STOCK_CONFIG = {
  in_stock: { label: 'In Stock', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  low_stock: { label: 'Low Stock', dot: 'bg-amber-500', text: 'text-amber-600' },
  out_of_stock: { label: 'Out of Stock', dot: 'bg-red-500', text: 'text-red-500' },
};

export default function MealKitDetail({ pkg }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const { getSelections, removeSelection, clearSelections } = useMealKit();

  const [selectedProteins, setSelectedProteins] = useState({});
  const [optCategories, setOptCategories] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);

  const selections = getSelections(pkg.id);
  const wished = isWishlisted(pkg.id);

  const kitStock = pkg.stock_status || 'in_stock';
  const stockCfg = STOCK_CONFIG[kitStock] || STOCK_CONFIG.in_stock;
  const kitAvailable = kitStock !== 'out_of_stock';

  const proteins = pkg.proteins || [];

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

  const toggleProtein = (name) => {
    setSelectedProteins((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const proteinsTotal = proteins
    .filter((p) => p.available !== false && selectedProteins[p.name])
    .reduce((sum, p) => sum + (p.price || 0), 0);

  const categoryAddOnsTotal = selections.reduce(
    (sum, s) => sum + s.price * s.quantity,
    0
  );

  const basePrice = pkg.total_price || pkg.starting_price || 0;
  const total = basePrice + proteinsTotal + categoryAddOnsTotal;
  const prepTime = pkg.prep_time || pkg.delivery_time || '25–40 mins';

  const handleAddToCart = () => {
    if (!kitAvailable) return;
    const chosenProteins = proteins
      .filter((p) => p.available !== false && selectedProteins[p.name])
      .map((p) => p.name);
    const addOnDetails = [
      ...chosenProteins,
      ...selections.map(
        (s) => `${s.name} (${s.quantity}${s.unit ? ' ' + s.unit : ''})`
      ),
    ];
    addItem({
      id: `mealkit-${pkg.id}`,
      name: pkg.name,
      price: total,
      image: pkg.image,
      unit: pkg.serves || 'Meal Kit',
      details: addOnDetails.length ? `Add-ons: ${addOnDetails.join(', ')}` : '',
    });
    clearSelections(pkg.id);
    navigate('/cart');
  };

  return (
    <div className="pb-40 bg-[#FAFAFA] min-h-screen">
      {/* Hero — blurred background, visually secondary */}
      <div className="relative w-full h-56 overflow-hidden">
        {pkg.image ? (
          <Image
            src={pkg.image}
            alt={pkg.name}
            fittingType="fill"
            className="absolute inset-0 w-full h-full scale-110 blur-[8px]"
          />
        ) : (
          <div className="w-full h-full bg-[#E8F5E9]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-[#E8F5E9]/55 to-white/85 pointer-events-none" />
        <div className="absolute inset-0 bg-[#2E7D32]/[0.08] pointer-events-none" />

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
      </div>

      {/* Info card — overlaps hero, is the focus */}
      <div className="relative -mt-6 mx-3 bg-white rounded-3xl shadow-sm border border-gray-50 p-5">
        <h1 className="text-xl font-bold text-gray-900 leading-tight">{pkg.name}</h1>
        {pkg.description && (
          <p className="text-sm text-gray-500 leading-relaxed mt-1.5">
            {pkg.description}
          </p>
        )}

        {/* Availability status row */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${stockCfg.dot}`} />
            <span className={`text-xs font-semibold ${stockCfg.text}`}>
              {stockCfg.label}
            </span>
          </span>
          <span className="w-px h-3 bg-gray-200" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            {pkg.serves || 'Serves 4–6'}
          </span>
          <span className="w-px h-3 bg-gray-200" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {prepTime}
          </span>
        </div>

        {/* Base price */}
        <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
          <div>
            <span className="text-[11px] text-gray-400 font-medium block leading-none mb-1">
              Base price
            </span>
            <span className="text-2xl font-bold text-[#2E7D32]">
              ₦{basePrice.toLocaleString()}
            </span>
          </div>
          {pkg.original_total && pkg.original_total > basePrice && (
            <span className="text-sm text-gray-400 line-through">
              ₦{pkg.original_total.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Add Optional Items — protein cards */}
      {proteins.length > 0 && (
        <div className="px-3 mt-5">
          <h2 className="text-base font-bold text-gray-900 mb-1">Add Optional Items</h2>
          <p className="text-xs text-gray-400 mb-3">Choose your preferred proteins</p>
          <div className="space-y-2.5">
            {proteins.map((protein) => (
              <ProteinOptionCard
                key={protein.name}
                protein={protein}
                selected={!!selectedProteins[protein.name]}
                onToggle={() => toggleProtein(protein.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Browse more categories */}
      {optCategories.length > 0 && (
        <div className="px-3 mt-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Browse More Items</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {optCategories.map((cat) => {
              const chosen = selections.find((s) => s.category_id === cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/category/${cat.id}?kit=${pkg.id}`)}
                  className="w-full flex items-center justify-between px-4 py-3.5 active:scale-[0.99] transition-transform"
                >
                  <span className="text-sm font-semibold text-gray-900">
                    {cat.icon} {cat.name}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs font-bold text-[#2E7D32]">
                    {chosen ? 'Add more' : 'Choose'}{' '}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Added to kit (from category browsing) */}
      {selections.length > 0 && (
        <div className="px-3 mt-5">
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

      {/* Cooking guide */}
      {pkg.cooking_instructions && (
        <div className="px-3 mt-6">
          <button
            onClick={() => setShowInstructions(true)}
            className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl border border-gray-100 py-3.5 text-sm font-semibold text-[#2E7D32] active:scale-[0.99] transition-transform"
          >
            <ChefHat className="w-4 h-4" /> View Cooking Guide
          </button>
        </div>
      )}

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-3 py-3 bg-white/95 backdrop-blur border-t border-gray-100 z-30">
        {kitAvailable ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[11px] text-gray-400 block leading-none mb-0.5">
                  Total
                </span>
                <span className="text-xl font-bold text-[#2E7D32]">
                  ₦{total.toLocaleString()}
                </span>
              </div>
              {(proteinsTotal > 0 || categoryAddOnsTotal > 0) && (
                <span className="text-[11px] text-gray-400 text-right leading-tight">
                  Kit ₦{basePrice.toLocaleString()}
                  {proteinsTotal > 0 && (
                    <>
                      <br />+ Proteins ₦{proteinsTotal.toLocaleString()}
                    </>
                  )}
                  {categoryAddOnsTotal > 0 && (
                    <>
                      <br />+ Add-ons ₦{categoryAddOnsTotal.toLocaleString()}
                    </>
                  )}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <ShoppingBag className="w-4 h-4" /> Add to Cart
            </button>
          </>
        ) : (
          <button
            disabled
            className="w-full h-12 rounded-2xl bg-gray-200 text-gray-400 font-bold text-sm flex items-center justify-center cursor-not-allowed"
          >
            Currently Unavailable
          </button>
        )}
      </div>

      <CookingInstructionsSheet
        open={showInstructions}
        onOpenChange={setShowInstructions}
      />
    </div>
  );
}