import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Check, ShoppingBag } from 'lucide-react';
import { useMealKit } from '@/context/MealKitContext';
import VariantPickerSheet from '@/components/product/VariantPickerSheet';
import { getDisplayPrice, getActiveVariants, getSingleVariant, buildCartItem } from '@/lib/variantPricing';

export default function KitProductCard({ product, kitId, categoryName }) {
  const navigate = useNavigate();
  const { addSelection } = useMealKit();
  const [qty, setQty] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const priceInfo = getDisplayPrice(product);
  const activeVariants = getActiveVariants(product);
  const singleVariant = getSingleVariant(product);

  const submitToKit = (variantProduct) => {
    addSelection(
      kitId,
      { ...variantProduct, category_id: product.category_id, category_name: categoryName },
      qty
    );
    navigate(`/package/${kitId}`);
  };

  const handleAdd = () => {
    if (activeVariants.length > 1) {
      setSheetOpen(true);
    } else if (singleVariant) {
      submitToKit(buildCartItem(product, singleVariant));
    } else {
      submitToKit(product);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-gray-50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9]">
            <ShoppingBag className="w-8 h-8 text-[#2E7D32]/40" />
          </div>
        )}
      </div>
      <div className="p-2.5 flex flex-col flex-1">
        <h3 className="text-xs font-semibold text-card-foreground leading-tight mb-0.5 line-clamp-2">
          {product.name}
        </h3>
        <span className="text-[11px] text-gray-400 mb-1">{product.unit || '1 pack'}</span>
        <span className={`font-bold text-[#2E7D32] mb-2 ${priceInfo.isRange ? 'text-[11px]' : 'text-sm'}`}>
          {priceInfo.text}
        </span>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
            >
              <Minus className="w-3.5 h-3.5 text-foreground" strokeWidth={2.5} />
            </button>
            <span className="text-sm font-bold text-foreground w-5 text-center">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-3.5 h-3.5 text-foreground" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="w-full h-9 rounded-full bg-[#2E7D32] text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-[0.98] transition-transform"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Add to Kit
        </button>
      </div>
      <VariantPickerSheet
        product={product}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdd={(variant) => submitToKit(buildCartItem(product, variant))}
      />
    </div>
  );
}