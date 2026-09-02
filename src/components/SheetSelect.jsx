import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Check, ChevronDown } from 'lucide-react';

export default function SheetSelect({
  value,
  onChange,
  options,
  placeholder,
  title,
  triggerClassName,
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={
            triggerClassName ||
            'w-full flex items-center justify-between text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white'
          }
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
            {selected?.label || placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title || 'Select'}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8 space-y-1.5">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#E8F5E9] text-[#1B7F3A] font-semibold'
                    : 'text-gray-700 active:bg-gray-50'
                }`}
              >
                <span>{o.label}</span>
                {active && <Check className="w-4 h-4 text-[#2E7D32]" />}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}