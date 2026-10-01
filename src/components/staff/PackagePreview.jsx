import React from 'react';
import { X, Clock, Check, ShoppingBag, Users } from 'lucide-react';

const formatNaira = (n) => `₦${(n || 0).toLocaleString()}`;

export default function PackagePreview({ pkg, onClose }) {
  const savings = (pkg.original_total || 0) - (pkg.total_price || 0);
  const savingsPercent = pkg.original_total > 0 ? Math.round((savings / pkg.original_total) * 100) : 0;
  const items = (pkg.items || []).filter((i) => i.active !== false);
  const bgSize = pkg.image_zoom > 1
    ? `${pkg.image_zoom * 100}%`
    : pkg.image_fit_mode === 'contain' ? 'contain' : 'cover';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-bold text-foreground">Package Preview</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="pb-4">
          {pkg.image && (
            <div className="w-full h-48 bg-gray-100 overflow-hidden">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${pkg.image})`,
                  backgroundSize: bgSize,
                  backgroundPosition: `${pkg.image_pos_x || 50}% ${pkg.image_pos_y || 50}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>
          )}
          <div className="px-4 -mt-4 relative">
            <div className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                {pkg.badge && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-[#2E7D32]">
                    {pkg.badge}
                  </span>
                )}
                {pkg.delivery_time && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Clock className="w-3.5 h-3.5" /> {pkg.delivery_time}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">{pkg.name || 'Untitled Package'}</h3>
              {pkg.description && <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>}
              {pkg.serves && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Users className="w-3.5 h-3.5" /> {pkg.serves}
                </span>
              )}
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Total Price</span>
                  <span className="text-2xl font-bold text-[#2E7D32]">{formatNaira(pkg.total_price)}</span>
                </div>
                {pkg.original_total > 0 && pkg.original_total > (pkg.total_price || 0) && (
                  <div className="text-right">
                    <span className="text-xs text-gray-400 line-through block">{formatNaira(pkg.original_total)}</span>
                    <span className="text-sm font-bold text-[#2E7D32]">
                      Save {formatNaira(savings)} ({savingsPercent}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {items.length > 0 && (
            <div className="px-4 mt-4">
              <h4 className="text-sm font-bold text-foreground mb-2">
                What's Included ({items.length} items)
              </h4>
              <div className="bg-card rounded-xl border border-border divide-y divide-gray-50">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-6 h-6 rounded object-contain" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="w-3 h-3 text-[#2E7D32]" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-foreground">{item.name}</span>
                      {item.optional && (
                        <span className="text-[10px] text-amber-600 font-semibold">Optional</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="px-4 mt-4">
            <button className="w-full h-11 rounded-xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Add Package to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}