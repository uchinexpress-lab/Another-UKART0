import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MessageCircle,
  AlertTriangle,
  ChevronDown,
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

export default function HelpSupport() {
  const [report, setReport] = useState('');

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
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${SUPPORT_PHONE}`}
          className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center text-center active:scale-95 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-[#2E7D32]/10 flex items-center justify-center mb-2">
            <Phone className="w-5 h-5 text-[#2E7D32]" />
          </div>
          <p className="text-sm font-bold text-gray-900">Call Support</p>
          <p className="text-[11px] text-gray-500">Mon–Sat, 8am–8pm</p>
        </a>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center text-center active:scale-95 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-[#2E7D32]/10 flex items-center justify-center mb-2">
            <Mail className="w-5 h-5 text-[#2E7D32]" />
          </div>
          <p className="text-sm font-bold text-gray-900">Email Support</p>
          <p className="text-[11px] text-gray-500 truncate w-full">Reply within 24h</p>
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Live Chat</p>
          <p className="text-xs text-gray-500">Chat with our team in real time</p>
        </div>
        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          Coming Soon
        </span>
      </div>

      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-2 px-1">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="bg-white rounded-2xl border border-gray-100 px-4">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b border-gray-50 last:border-0">
              <AccordionTrigger className="text-sm font-semibold text-gray-900 text-left py-4">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-500 pb-4">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Report a Problem
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Tell us what went wrong and we'll look into it.
        </p>
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
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#2E7D32] font-medium">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}