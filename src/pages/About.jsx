import React, { useState } from 'react';
import { Leaf, Truck, Shield } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { usePageContent } from '@/lib/usePageContent';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const APP_VERSION = '1.0.0';
const LOGO_URL = '/ukart-logo.webp';

const TERMS = `These Terms & Conditions govern your use of the UKART app and your grocery orders within Lagos, Nigeria. By placing an order, you agree to provide accurate delivery details (name, phone number, address and landmark) and to be available to receive your order at the scheduled time. All orders are subject to product availability; if an item is unavailable, we will notify you and adjust your order and total accordingly. Delivery times shown (35–90 minutes on the Island, same-day on the Mainland) are estimates and may be affected by traffic, weather or rider availability. Prices are listed in Nigerian Naira (₦) and include applicable charges unless a delivery fee is separately stated. Payment is currently accepted via Cash on Delivery, payable to the rider upon receipt of your order. You may cancel an order before it is dispatched by contacting support with your order number; orders already out for delivery cannot be cancelled. UKART Fresh Ventures reserves the right to refuse, modify or cancel any order, and to update these terms at any time.`;

const PRIVACY = `UKART Fresh Ventures respects your privacy. This Privacy Policy explains how we handle your information when you use the UKART app. We collect your name, email, phone number, and delivery address solely to process your orders, coordinate delivery, and keep you updated on order status. We also store your saved delivery addresses and preferences to make future orders faster. When you save a payment card, only the last four digits and card brand are retained — your full card number is never stored. We do not sell or rent your personal data. Order and delivery information is shared with our delivery riders only as needed to fulfil your order. You may request access to, correction of, or deletion of your personal data at any time by contacting support. By using UKART, you consent to the collection and use of your information as described here.`;

export default function About() {
  const { getField, isSectionVisible } = usePageContent('about');

  const title = getField('title', 'UKART');
  const subtitle = getField('subtitle', 'No Market Wahala');
  const description = getField('description',
    'UKART is a modern online grocery platform built to make grocery shopping easier across Lagos. Whether customers need everyday groceries or carefully curated grocery packages, UKART delivers fresh products directly to their doorstep. Our mission is simple: No Market Wahala. We help customers save time, shop conveniently, and enjoy reliable delivery through a simple, modern mobile experience.'
  );
  const contactEmail = getField('contact_email', 'support@ukart.ng');
  const contactPhone = getField('contact_phone', '+234 800 UKART');
  const contactAddress = getField('contact_address', 'Lagos, Nigeria');

  return (
    <div className="uk-page space-y-4">
      {isSectionVisible('hero', true) && (
        <div className="flex flex-col items-center text-center">
          <Image
            src={LOGO_URL}
            fittingType="fit"
            className="w-32 h-32"
          />
          <h1 className="uk-title mt-2">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          <span className="mt-2 text-[11px] font-bold text-[#2E7D32] bg-primary/10 px-3 py-1 rounded-full">
            Version {APP_VERSION}
          </span>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground mb-2">About {title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>

      {isSectionVisible('contact', true) && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-bold text-foreground mb-3">Company Information</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Company</span>
              <span className="font-medium text-foreground">UKART Fresh Ventures</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium text-foreground">{contactAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{contactEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium text-foreground">{contactPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium text-foreground">{APP_VERSION}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Truck, label: 'Fast Delivery' },
          { icon: Shield, label: 'Quality Assured' },
          { icon: Leaf, label: 'Always Fresh' },
        ].map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border p-3 flex flex-col items-center text-center"
            >
              <Icon className="w-5 h-5 text-[#2E7D32] mb-1" />
              <span className="text-[11px] font-medium text-gray-600">{f.label}</span>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-2 px-1">Legal</h2>
        <Accordion type="single" collapsible className="bg-card rounded-2xl border border-border px-4">
          <AccordionItem value="terms" className="border-b border-gray-50 last:border-0">
            <AccordionTrigger className="text-sm font-semibold text-foreground text-left py-4">
              Terms & Conditions
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
              {TERMS}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="privacy" className="border-b border-gray-50 last:border-0">
            <AccordionTrigger className="text-sm font-semibold text-foreground text-left py-4">
              Privacy Policy
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
              {PRIVACY}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <p className="text-center text-xs text-gray-400">© 2026 UKART Fresh Ventures. All rights reserved.</p>
    </div>
  );
}