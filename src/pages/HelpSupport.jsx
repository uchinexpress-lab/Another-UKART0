import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  Package,
  CreditCard,
  Leaf,
  Undo2,
  User,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

const SUPPORT_PHONE = '+2348012345678';
const SUPPORT_EMAIL = 'ukartfreshventures@gmail.com';

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Island areas typically receive orders within 35–90 minutes. Mainland areas are delivered same-day. You can check your delivery zone in the location selector on the home screen.',
  },
  {
    q: 'What are the delivery fees?',
    a: 'A normal delivery fee applies to help get your order to you quickly and reliably. The exact amount is shown at checkout before you place your order.',
  },
  {
    q: 'How do I track my order?',
    a: 'Open My Orders, tap any order to see its live status, or use the Track Order page with your order number.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We currently accept Cash on Delivery. Secure online payments via Paystack are coming soon.',
  },
  {
    q: 'Can I cancel an order?',
    a: 'Yes — contact support with your order number before it is dispatched and we will cancel and refund you.',
  },
];

const TOPICS = [
  { icon: Package, label: 'Orders & Delivery', kw: 'delivery' },
  { icon: CreditCard, label: 'Payments', kw: 'payment' },
  { icon: Leaf, label: 'Product Quality', kw: 'quality' },
  { icon: Undo2, label: 'Returns & Refunds', kw: 'refund' },
  { icon: User, label: 'Account & Profile', kw: 'account' },
  { icon: Tag, label: 'Promotions', kw: 'promo' },
];

export default function HelpSupport() {
  const [report, setReport] = useState('');
  const [query, setQuery] = useState('');

  const filtered = FAQS.filter((f) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (f.q + ' ' + f.a).toLowerCase().includes(q);
  });

  const sendReport = () => {
    if (!report.trim()) {
      toast({ title: 'Please describe the issue', variant: 'destructive' });
      return;
    }
    const subject = encodeURIComponent('Ukart Problem Report');
    const body = encodeURIComponent(report.trim());
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="p-4 space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help topics..."
          className="w-full pl-10 pr-4 h-12 rounded-full bg-white border border-gray-200 text-sm outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all"
        />
      </div>

      {/* Popular topics */}
      <div>
        <h2 className="text-sm font-bold text-[#1a2238] mb-3 px-1">
          Popular Topics
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {TOPICS.map((t) => {
            const active = query.trim().toLowerCase() === t.kw;
            return (
              <button
                key={t.label}
                onClick={() => setQuery(active ? '' : t.kw)}
                className={`rounded-2xl border p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform ${
                  active
                    ? 'border-[#2E7D32] bg-[#EEF8EE]'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    active ? 'bg-[#2E7D32]' : 'bg-[#EEF8EE]'
                  }`}
                >
                  <t.icon
                    className={`w-5 h-5 ${active ? 'text-white' : 'text-[#2E7D32]'}`}
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-sm font-bold text-[#1a2238] mb-2 px-1">
          Frequently Asked Questions
        </h2>
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-500">
              No articles match your search.
            </p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="bg-white rounded-2xl border border-gray-100 px-4"
          >
            {filtered.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-gray-50 last:border-0"
              >
                <AccordionTrigger className="text-sm font-semibold text-gray-900 text-left py-4">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-500 pb-4">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Still need help */}
      <div>
        <h2 className="text-sm font-bold text-[#1a2238] mb-2 px-1">
          Still need help?
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          <Link
            to="/tickets"
            className="flex items-center gap-3 p-4 active:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EEF8EE] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#2E7D32]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Chat with our support team
              </p>
              <p className="text-xs text-gray-500">
                Open a ticket, we reply fast
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="flex items-center gap-3 p-4 active:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EEF8EE] flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#2E7D32]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Call Support</p>
              <p className="text-xs text-gray-500">Mon–Sat, 8am–8pm</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 p-4 active:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EEF8EE] flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#2E7D32]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Email Support</p>
              <p className="text-xs text-gray-500">Reply within 24h</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </a>
        </div>
      </div>

      {/* Report a problem */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Report a Problem
        </h2>
        <Textarea
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Describe the issue..."
          rows={4}
          className="rounded-xl resize-none"
        />
        <Button
          className="w-full mt-3 h-11 rounded-xl"
          onClick={sendReport}
        >
          <Mail className="w-4 h-4 mr-2" /> Submit Report
        </Button>
      </div>

      <p className="text-center text-xs text-gray-400">
        Contact us at{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-[#2E7D32] font-medium"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}