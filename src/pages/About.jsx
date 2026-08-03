import React, { useState } from 'react';
import {
  ShoppingBag,
  ChevronDown,
  Heart,
  Truck,
  Shield,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const APP_VERSION = '1.0.0';

const TERMS = `These Terms govern your use of the Ukart app. By placing an order, you agree to provide accurate delivery information and to be available to receive your order. Orders are subject to availability. Delivery times are estimates and may vary due to traffic or weather. Payments are due via Cash on Delivery unless online payment is selected. We reserve the right to refuse or cancel any order. Prices are listed in Nigerian Naira and may change without notice.`;

const PRIVACY = `Ukart respects your privacy. We collect your name, phone number, email and delivery address solely to fulfil your orders and communicate delivery updates. We do not sell your personal data. Payment card details, when collected, are stored as the last four digits only. You may request deletion of your data by contacting support. By using the app, you consent to this privacy policy.`;

export default function About() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-3 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #1B7F3A, #2E9E44)' }}
        >
          <ShoppingBag className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Ukart</h1>
        <p className="text-sm text-gray-500">No Market Wahala</p>
        <span className="mt-2 text-[11px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-3 py-1 rounded-full">
          Version {APP_VERSION}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-2">About Ukart</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Ukart is a premium grocery delivery service for Lagos, offering curated shopping
          packages, budget-based browsing, and fast, reliable home delivery. We source fresh
          produce, proteins and everyday essentials so you can skip the market and shop from
          your phone.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Truck, label: 'Fast Delivery' },
          { icon: Shield, label: 'Quality Assured' },
          { icon: Heart, label: 'Lagos Grown' },
        ].map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center text-center"
            >
              <Icon className="w-5 h-5 text-[#2E7D32] mb-1" />
              <span className="text-[11px] font-medium text-gray-600">{f.label}</span>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-2 px-1">Legal</h2>
        <Accordion type="single" collapsible className="bg-white rounded-2xl border border-gray-100 px-4">
          <AccordionItem value="terms" className="border-b border-gray-50 last:border-0">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 text-left py-4">
              Terms & Conditions
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-500 pb-4 leading-relaxed">
              {TERMS}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="privacy" className="border-b border-gray-50 last:border-0">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 text-left py-4">
              Privacy Policy
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-500 pb-4 leading-relaxed">
              {PRIVACY}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <p className="text-center text-xs text-gray-400">© 2026 Ukart Fresh Ventures. All rights reserved.</p>
    </div>
  );
}