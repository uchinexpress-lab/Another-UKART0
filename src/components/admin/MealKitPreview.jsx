import React from 'react';
import { X, Clock, Users, ChefHat } from 'lucide-react';

export default function MealKitPreview({ kit, onClose }) {
  const formatNaira = (n) => `₦${(n || 0).toLocaleString()}`;
  const items = kit.items || [];
  const steps = kit.cooking_steps || [];
  const optionalItems = (kit.optional_items || []).filter(i => i.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-bold text-foreground">Meal Kit Preview</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          {kit.image && (
            <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100">
              <img src={kit.image} alt={kit.name} className="w-full h-full object-contain" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-foreground">{kit.name || 'Untitled Meal Kit'}</h3>
            {kit.description && <p className="text-sm text-muted-foreground mt-1">{kit.description}</p>}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg font-bold text-[#2E7D32]">{formatNaira(kit.total_price)}</span>
              {kit.original_total > 0 && kit.original_total > (kit.total_price || 0) && (
                <span className="text-sm text-gray-400 line-through">{formatNaira(kit.original_total)}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {kit.serves && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {kit.serves}</span>}
              {kit.prep_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {kit.prep_time}</span>}
            </div>
          </div>
          {items.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5"><ChefHat className="w-4 h-4" /> Ingredients</h4>
              <div className="space-y-1.5">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {item.image && <img src={item.image} alt="" className="w-6 h-6 rounded object-contain" />}
                    <span className="font-medium text-foreground">{item.name}</span>
                    {item.quantity && <span className="text-muted-foreground">{item.quantity} {item.unit}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {optionalItems.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-foreground mb-2">Optional Add-ons</h4>
              <div className="space-y-1.5">
                {optionalItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      {item.image && <img src={item.image} alt="" className="w-6 h-6 rounded object-contain" />}
                      {item.name}
                    </span>
                    {item.price > 0 && <span className="text-[#2E7D32] font-semibold">{formatNaira(item.price)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {steps.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-foreground mb-2">Cooking Instructions</h4>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#2E7D32] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{step.step || idx + 1}</span>
                    <div className="flex-1">
                      {step.title && <p className="text-xs font-bold text-foreground">{step.title}</p>}
                      {step.text && <p className="text-xs text-muted-foreground mt-0.5">{step.text}</p>}
                      {step.image && <img src={step.image} alt="" className="w-full h-24 rounded-lg object-contain mt-1.5 bg-gray-50" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}