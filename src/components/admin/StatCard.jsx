import React from 'react';

const TONES = {
  default: 'bg-muted text-foreground',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-sky-50 text-sky-700',
};

export default function StatCard({ icon: Icon, label, value, tone = 'default' }) {
  return (
    <div className={`rounded-xl p-3 ${TONES[tone]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
        <span className="text-[11px] font-medium opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold leading-none">{value}</div>
    </div>
  );
}