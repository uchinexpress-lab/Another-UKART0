import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Check } from 'lucide-react';
import ProductCardSurface from '@/components/product/ProductCardSurface';
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
    <ProductCardSurface product={product} priceInfo={priceInfo} onAdd={handleAdd}>
      <div className="px-2.5 pb-2.5 flex flex-col">
        <span className="h-4 leading-4 truncate text-[11px] text-gray-400 mb-1">{product.unit || '1 pack'}</span>
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
    </ProductCardSurface>
  );
}