import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function OrderSuccessHero() {
  return (
    <div className="flex flex-col items-center text-center pt-1 pb-1">
      <div className="w-[72px] h-[72px] rounded-full bg-secondary flex items-center justify-center mb-3">
        <CheckCircle2 className="w-10 h-10 text-retail" strokeWidth={2.4} />
      </div>
      <h2 className="text-[19px] font-extrabold text-retail tracking-tight">Order Completed</h2>
      <p className="text-[13px] text-muted-foreground mt-1">Thank you for shopping with Ukart!</p>
    </div>
  );
}