import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Check, Clock, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import MealKitDetail from '@/components/package/MealKitDetail';
import { Image } from '@/components/ui/image';

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Package.get(id).then((p) => {
      setPkg(p);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  if (!pkg)
    return (
      <div className="p-8 text-center text-muted-foreground">Package not found</div>
    );

  // Meal kits use the redesigned premium detail screen.
  if (pkg.group === 'meal_kits') {
    return <MealKitDetail pkg={pkg} />;
  }

  // Essentials packages keep the existing layout.
  const savings = (pkg.original_total || 0) - (pkg.total_price || 0);

  return (
    <div className="pb-32">
      <div className="h-56 bg-muted">
        <Image
          src={pkg.image}
          alt={pkg.name}
          className="w-full h-56"
          fittingType="fill"
        />
      </div>

      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-1.5">
          {pkg.badge && <span className="uk-meta-chip">{pkg.badge}</span>}
          {pkg.delivery_time && (
            <span className="flex items-center gap-1 uk-meta ml-auto">
              <Clock className="w-3 h-3" /> {pkg.delivery_time}
            </span>
          )}
        </div>

        <h1 className="text-[19px] font-bold text-foreground leading-snug">{pkg.name}</h1>
        {pkg.description && <p className="uk-sub mt-1">{pkg.description}</p>}

        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-xl font-bold text-retail">
            ₦{pkg.total_price.toLocaleString()}
          </span>
          {pkg.original_total > pkg.total_price && (
            <span className="text-[12px] text-muted-foreground line-through">
              ₦{pkg.original_total.toLocaleString()}
            </span>
          )}
          {savings > 0 && <span className="uk-meta-chip">Save ₦{savings.toLocaleString()}</span>}
        </div>
      </div>

      {pkg.items?.length > 0 && (
        <div className="px-4 mt-5">
          <p className="uk-section-label mb-2">
            What&apos;s included · {pkg.item_count} items
          </p>
          <div className="uk-card divide-y divide-border overflow-hidden">
            {pkg.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Check className="w-3.5 h-3.5 text-retail shrink-0" strokeWidth={2.5} />
                  <span className="text-[13px] text-foreground truncate">{item.name}</span>
                </div>
                <span className="text-[12px] text-muted-foreground shrink-0 ml-2">
                  {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pkg.addons?.length > 0 && (
        <div className="px-4 mt-5">
          <p className="uk-section-label mb-2">Suggested add-ons</p>
          <div className="uk-card divide-y divide-border overflow-hidden">
            {pkg.addons.map((addon, i) => (
              <div key={i} className="flex items-center justify-between px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{addon.name}</p>
                  <p className="text-[12px] font-bold text-retail">
                    ₦{addon.price.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() =>
                    addItem({
                      id: `addon-${pkg.id}-${i}`,
                      name: addon.name,
                      price: addon.price,
                      image: pkg.image,
                      unit: '1 pack',
                    })
                  }
                  aria-label={`Add ${addon.name}`}
                  className="w-8 h-8 rounded-lg bg-retail flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                >
                  <Plus className="w-4 h-4 text-retail-foreground" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="uk-cta"
        style={{ bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <button
          onClick={() => {
            addItem({
              id: `package-${pkg.id}`,
              name: pkg.name,
              price: pkg.total_price,
              image: pkg.image,
              unit: `${pkg.item_count} items`,
            });
            navigate('/cart');
          }}
          className="uk-btn"
        >
          <ShoppingBag className="w-4 h-4" /> Add package to cart
        </button>
      </div>
    </div>
  );
}