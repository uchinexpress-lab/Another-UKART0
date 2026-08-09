import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Check, Clock, Plus, ShoppingBag, Users } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import MealKitCustomizer from '@/components/package/MealKitCustomizer';

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
      </div>);

  }
  if (!pkg) return <div className="p-8 text-center text-gray-500">Package not found</div>;

  const isMealKit = pkg.group === 'meal_kits';
  const savings = (pkg.original_total || 0) - (pkg.total_price || 0);

  return (
    <div className="pb-40">
      <div className="relative h-64 bg-gray-100">
        <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-sm hidden">
          
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <div className="px-4 -mt-6 relative">
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            {pkg.badge &&
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                {pkg.badge}
              </span>
            }
            <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
              <Clock className="w-3.5 h-3.5" /> {pkg.delivery_time}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h1>
          <p className="text-sm text-gray-500 mb-3">{pkg.description}</p>
          {isMealKit && pkg.serves &&
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#2E7D32] bg-[#E8F5E9] w-fit px-2.5 py-1 rounded-full mb-4">
              <Users className="w-3.5 h-3.5" />
              {pkg.serves}
            </div>
          }

          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs text-gray-400 block">
                {isMealKit ? 'Base Kit Price' : 'Total Price'}
              </span>
              <span className="text-3xl font-bold text-[#2E7D32]">
                ₦{pkg.total_price.toLocaleString()}
              </span>
            </div>
            {!isMealKit &&
            <div className="text-right">
                <span className="text-xs text-gray-400 line-through block">
                  ₦{pkg.original_total.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-[#2E7D32]">
                  Save ₦{savings.toLocaleString()}
                </span>
              </div>
            }
          </div>
        </div>
      </div>

      {isMealKit ?
      <MealKitCustomizer pkg={pkg} /> :

      <>
          {pkg.items?.length > 0 &&
        <div className="px-4 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                What's Included ({pkg.item_count} items)
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {pkg.items.map((item, i) =>
            <div key={i} className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{item.quantity}</span>
                  </div>
            )}
              </div>
            </div>
        }

          {pkg.addons?.length > 0 &&
        <div className="px-4 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Suggested Add-ons</h2>
              <div className="space-y-2">
                {pkg.addons.map((addon, i) =>
            <div
              key={i}
              className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-3">
              
                    <div>
                      <span className="text-sm font-medium text-gray-900 block">{addon.name}</span>
                      <span className="text-sm font-bold text-[#2E7D32]">
                        ₦{addon.price.toLocaleString()}
                      </span>
                    </div>
                    <button
                onClick={() =>
                addItem({
                  id: `addon-${pkg.id}-${i}`,
                  name: addon.name,
                  price: addon.price,
                  image: pkg.image,
                  unit: '1 pack'
                })
                }
                className="w-8 h-8 rounded-full bg-[#2E7D32] flex items-center justify-center">
                
                      <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </button>
                  </div>
            )}
              </div>
            </div>
        }

          <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 py-3 bg-white border-t border-gray-100">
            <button
            onClick={() => {
              addItem({
                id: `package-${pkg.id}`,
                name: pkg.name,
                price: pkg.total_price,
                image: pkg.image,
                unit: `${pkg.item_count} items`
              });
              navigate('/cart');
            }}
            className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] transition-colors">
            
              <ShoppingBag className="w-4 h-4" /> Add Package to Cart
            </button>
          </div>
        </>
      }
    </div>);

}