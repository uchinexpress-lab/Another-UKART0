import React from 'react';
import { ShoppingBasket } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function PurchasedItemsCard({ items = [], rows = [], total = 0 }) {
  return (
    <div className="uk-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBasket className="w-4 h-4 text-retail" />
        <p className="text-[11px] font-bold uppercase tracking-wide text-foreground">Purchased Items</p>
      </div>

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.key} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary overflow-hidden flex items-center justify-center shrink-0">
              {it.image ? (
                <Image src={it.image} alt={it.name} className="w-10 h-10" />
              ) : (
                <ShoppingBasket className="w-5 h-5 text-retail" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-foreground truncate">{it.name}</p>
              {it.sub && <p className="text-[11px] text-muted-foreground truncate">{it.sub}</p>}
            </div>
            <span className="text-[13px] font-semibold text-foreground shrink-0">
              ₦{it.price.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-border mt-3.5 pt-3 space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-[12px]">
            <span className="text-muted-foreground">{r.label}</span>
            <span className={r.discount ? 'text-retail font-semibold' : 'text-foreground'}>
              {r.discount
                ? `−₦${Math.abs(r.value).toLocaleString()}`
                : `₦${r.value.toLocaleString()}`}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-2 mt-1 border-t border-border">
          <span className="text-[13px] font-bold text-foreground">Total Amount Paid</span>
          <span className="text-[15px] font-extrabold text-retail">₦{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}