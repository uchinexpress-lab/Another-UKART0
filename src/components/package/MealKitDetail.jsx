import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Users,
  Clock,
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
import MealKitIngredients from './MealKitIngredients';
import MealKitSizes from './MealKitSizes';
import MealKitAddons from './MealKitAddons';
import MealKitOptionalItems from './MealKitOptionalItems';

const STOCK_CONFIG = {
  in_stock: {
    label: 'IN STOCK',
    sublabel: 'Ready to order',
    dot: 'bg-emerald-300',
    banner: 'bg-[#2E7D32]/85',
    blur: 'blur-[2px]',
  },
  low_stock: {
    label: 'LOW STOCK',
    sublabel: 'Limited availability',
    dot: 'bg-amber-200',
    banner: 'bg-amber-500/85',
    blur: 'blur-[3px]',
  },
  out_of_stock: {
    label: 'OUT OF STOCK',
    sublabel: 'Currently unavailable',
    dot: 'bg-red-200',
    banner: 'bg-red-600/80',
    blur: 'blur-[4px]',
  },
};

export default function MealKitDetail({ pkg }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const { getSelections, removeSelection, clearSelections } = useMealKit();

  const [selectedProteins, setSelectedProteins] = useState({});
  const [optCategories, setOptCategories] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState({});

  const selections = getSelections(pkg.id);
  const wished = isWishlisted(pkg.id);

  const kitStock = pkg.stock_status || 'in_stock';
  const stockCfg = STOCK_CONFIG[kitStock] || STOCK_CONFIG.in_stock;
  const kitAvailable = kitStock !== 'out_of_stock' && pkg.active !== false;

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

  const chosenSize = selectedSize != null ? (pkg.sizes || [])[selectedSize] : null;
  const kitAddons = pkg.addons || [];
  const addOnsTotal = kitAddons.reduce(
    (sum, addon, index) =>
      selectedAddons[index] && addon.active !== false && addon.available !== false
        ? sum + (addon.price || 0)
        : sum,
    0
  );

  const basePrice = (chosenSize?.price ?? pkg.total_price) || pkg.starting_price || 0;
  const total = basePrice + proteinsTotal + categoryAddOnsTotal + addOnsTotal;
  const extrasTotal = proteinsTotal + categoryAddOnsTotal + addOnsTotal;
  const servesLabel = chosenSize?.serves || pkg.serves || 'Serves 4–6';
  const prepTime = pkg.prep_time || pkg.delivery_time || '25–40 mins';

  const handleAddToCart = () => {
    if (!kitAvailable) return;
    const chosenProteins = proteins
      .filter((p) => p.available !== false && selectedProteins[p.name])
      .map((p) => p.name);
    const chosenAddons = kitAddons
      .filter((a, index) => selectedAddons[index] && a.active !== false && a.available !== false)
      .map((a) => a.name);
    const addOnDetails = [
      ...chosenProteins,
      ...selections.map(
        (s) => `${s.name} (${s.quantity}${s.unit ? ' ' + s.unit : ''})`
      ),
      ...chosenAddons,
    ];
    addItem({
      id: `mealkit-${pkg.id}${chosenSize ? `-${chosenSize.label}` : ''}`,
      package_id: pkg.id,
      size_label: chosenSize?.label || '',
      addon_ids: kitAddons
        .filter((a, index) => selectedAddons[index] && a.active !== false && a.available !== false)
        .map((a) => a.id)
        .filter(Boolean),
      protein_names: chosenProteins,
      selections: selections.map((s) => ({ product_id: s.id, quantity: s.quantity })),
      name: chosenSize ? `${pkg.name} — ${chosenSize.label}` : pkg.name,
      price: total,
      image: pkg.image,
      unit: chosenSize?.serves || pkg.serves || 'Meal Kit',
      details: addOnDetails.length ? `Add-ons: ${addOnDetails.join(', ')}` : '',
    });
    clearSelections(pkg.id);
    setSelectedAddons({});
    navigate('/cart');
  };

  return (
    <div className="pb-48 bg-[#FAFAFA] min-h-screen">
      {/* Hero — blurred background with availability ribbon across the middle */}
      <div className="relative w-full h-56 overflow-hidden">
        {pkg.image ? (
          <Image
            src={pkg.image}
            alt={pkg.name}
            fittingType="fill"
            className={`absolute inset-0 w-full h-full scale-105 ${stockCfg.blur}`}
          />
        ) : (
          <div className="w-full h-full bg-[#E8F5E9]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-[#E8F5E9]/40 to-white/75 pointer-events-none" />
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
          className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-sm active:scale-90 transition-transform z-10"
          aria-label="Favourite"
        >
          <Heart
            className={`w-5 h-5 ${
              wished ? 'fill-[#2E7D32] text-[#2E7D32]' : 'text-gray-400'
            }`}
          />
        </button>

        {/* Availability ribbon — centered across the middle of the hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] z-10">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl ${stockCfg.banner} backdrop-blur-md shadow-lg`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${stockCfg.dot} shrink-0`}
            />
            <div>
              <div className="text-white font-bold text-sm tracking-wide leading-tight">
                {stockCfg.label}
              </div>
              <div className="text-white/85 text-xs leading-tight mt-0.5">
                {stockCfg.sublabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info card — overlaps hero, is the focus */}
      <div className="relative -mt-6 mx-3 bg-white rounded-3xl shadow-sm border border-gray-50 p-5">
        {pkg.badge && (
          <span className="inline-block bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 tracking-wide">
            {pkg.badge}
          </span>
        )}
        <h1 className="text-xl font-bold text-gray-900 leading-tight">{pkg.name}</h1>
        {pkg.description && (
          <p className="text-sm text-gray-500 leading-relaxed mt-1.5">
            {pkg.description}
          </p>
        )}
        {pkg.description_long && (
          <p className="text-sm text-gray-500 leading-relaxed mt-2 whitespace-pre-line">
            {pkg.description_long}
          </p>
        )}

        {/* Serves & prep time */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            {servesLabel}
          </span>
          <span className="w-px h-3 bg-gray-200" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {prepTime}
          </span>
          {pkg.delivery_time && (
            <>
              <span className="w-px h-3 bg-gray-200" />
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                {pkg.delivery_time}
              </span>
            </>
          )}
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

      <MealKitSizes
        sizes={pkg.sizes}
        selectedIndex={selectedSize}
        onSelect={setSelectedSize}
      />

      <MealKitIngredients items={pkg.items} />

      <MealKitAddons
        addons={pkg.addons}
        selected={selectedAddons}
        onToggle={(index) =>
          setSelectedAddons((prev) => ({ ...prev, [index]: !prev[index] }))
        }
      />

      <MealKitOptionalItems items={pkg.optional_items} />

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

      {/* Floating bottom CTA — compact, clear of the bottom nav and page content */}
      <div
        className="fixed left-0 right-0 z-30 max-w-md mx-auto px-3"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
      >
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-lg px-3 py-2.5">
          <div className="min-w-0 pl-1">
            <span className="text-[10px] text-gray-400 block leading-none mb-1">Total</span>
            <span className="text-lg font-bold text-[#2E7D32] leading-none block">
              ₦{total.toLocaleString()}
            </span>
          </div>
          {kitAvailable ? (
            <button
              onClick={handleAddToCart}
              className="flex-1 h-11 rounded-xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <ShoppingBag className="w-4 h-4" /> Add to Cart
            </button>
          ) : (
            <div className="flex-1 h-11 rounded-xl bg-gray-200 text-gray-400 font-bold text-sm flex items-center justify-center">
              Currently Unavailable
            </div>
          )}
        </div>
        {extrasTotal > 0 && (
          <p className="text-[10px] text-gray-500 text-center mt-1">
            ₦{basePrice.toLocaleString()} kit + ₦{extrasTotal.toLocaleString()} extras
          </p>
        )}
      </div>
    </div>
  );
}