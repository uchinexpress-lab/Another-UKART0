import React from 'react';
import { Leaf } from 'lucide-react';

export default function UkartLogo({ size = 'md', className = '' }) {
  const dim = size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const icon = size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const text = size === 'lg' ? 'text-2xl' : 'text-xl';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${dim} rounded-xl bg-[#2E7D32] flex items-center justify-center shadow-sm`}>
        <Leaf className={`${icon} text-white`} strokeWidth={2.5} />
      </div>
      <span className={`${text} font-extrabold text-[#1a2238] tracking-tight`}>
        Ukart
      </span>
    </div>
  );
}