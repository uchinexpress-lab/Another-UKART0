import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { ChefHat } from 'lucide-react';

// Generic step-by-step guide for a Nigerian meal kit. The package data model
// has no dedicated cooking-instructions field, so this is a sensible default
// that applies to most stovetop meal kits (jollof, rice, stews).
const DEFAULT_STEPS = [
  'Wash and parboil the rice, then drain and set it aside.',
  'Heat the cooking oil in a pot over medium heat and sauté the onions until fragrant.',
  'Add the blended fresh tomatoes, red bell pepper, and scotch bonnet; cook for 8–10 minutes.',
  'Stir in the tomato paste, seasoning, and spices; mix until well combined.',
  'Pour in water or stock and bring to a gentle boil.',
  'Add the parboiled rice, reduce the heat to low, and cover tightly.',
  'Simmer until the rice is fully cooked and the liquid is absorbed.',
  'Fluff with a fork and serve hot. Enjoy your meal!',
];

export default function CookingInstructionsSheet({ open, onOpenChange }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-[#2E7D32]" />
            </span>
            Cooking Instructions
          </DrawerTitle>
          <DrawerDescription>
            Follow these simple steps to prepare your meal kit.
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8">
          <ol className="space-y-3">
            {DEFAULT_STEPS.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 leading-relaxed pt-0.5">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </DrawerContent>
    </Drawer>
  );
}