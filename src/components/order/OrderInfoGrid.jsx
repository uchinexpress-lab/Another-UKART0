import React from 'react';

function Cell({ label, value, dot = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-retail">{label}</p>
      <p className="text-[12.5px] font-bold text-foreground mt-1 flex items-start gap-1.5 leading-snug">
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-retail shrink-0 mt-1.5" />}
        <span className="min-w-0">{value}</span>
      </p>
    </div>
  );
}

export default function OrderInfoGrid({ date, payment, status, delivery }) {
  return (
    <div className="uk-card p-4 grid grid-cols-2 gap-y-4 gap-x-3">
      <Cell label="Date & Time" value={date} />
      <Cell label="Payment Method" value={payment} />
      <Cell label="Order Status" value={status} dot />
      <Cell label="Delivery Time" value={delivery} />
    </div>
  );
}