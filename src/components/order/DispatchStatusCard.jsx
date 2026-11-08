import React from 'react';
import { Truck } from 'lucide-react';

export default function DispatchStatusCard({ label, subtext }) {
  return (
    <div className="rounded-2xl bg-secondary p-3.5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0">
        <Truck className="w-[18px] h-[18px] text-retail" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-foreground">Dispatch Status</p>
        <p className="text-[11px] text-muted-foreground truncate">{subtext}</p>
      </div>
      <span className="shrink-0 max-w-[45%] text-[10px] font-bold uppercase tracking-wide text-retail px-2.5 py-1 rounded-full bg-card truncate">
        {label}
      </span>
    </div>
  );
}