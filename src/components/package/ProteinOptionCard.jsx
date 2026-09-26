import React from 'react';
import { Check } from 'lucide-react';

/**
 * ProteinOptionCard — a clean selectable card for an optional protein add-on.
 * Reflects dynamic availability: available items are selectable; out-of-stock
 * items are faded, disabled, and labelled "Out of Stock".
 */
export default function ProteinOptionCard({ protein, selected, onToggle }) {
  const available = protein.available !== false;

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => available && onToggle()}
      className={`w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] ${
        !available
          ? 'bg-gray-50/70 border-gray-100 opacity-60 cursor-not-allowed'
          : selected
          ? 'bg-[#E8F5E9] border-[#2E7D32] shadow-sm'
          : 'bg-white border-gray-100'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 transition-colors ${
          !available
            ? 'bg-gray-100 border-gray-200'
            : selected
            ? 'bg-[#2E7D32] border-[#2E7D32]'
            : 'bg-white border-gray-300'
        }`}
      >
        {selected && available && (
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-semibold block ${
            available ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          {protein.name}
        </span>
        <span
          className={`text-[11px] font-medium ${
            available ? 'text-[#2E7D32]' : 'text-red-400'
          }`}
        >
          {available ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
      <span
        className={`text-sm font-bold ${
          available ? 'text-gray-900' : 'text-gray-400'
        }`}
      >
        ₦{(protein.price || 0).toLocaleString()}
      </span>
    </button>
  );
}