import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Mail,
  MessageCircle,
  ChevronRight,
  Package,
  CreditCard,
  Leaf,
  Undo2,
  User,
  Tag,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { usePageContent } from '@/lib/usePageContent';

const SUPPORT_EMAIL = 'hello@ukartapp.com';

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Our Island delivery target is approximately 30 minutes, but this is not a guaranteed time. Actual delivery depends on order preparation, rider availability, traffic and your exact location. Mainland areas are delivered same-day. You can check your delivery zone in the location selector on the home screen.',
    topic: 'delivery',
  },
  {
    q: 'What are the delivery fees?',
    a: 'Delivery fees are location-based and depend on your delivery area (Island or Mainland). The exact fee is calculated and displayed during checkout before you make payment, so you can review your full order summary before placing an order.',
    topic: 'delivery',
  },
  {
    q: 'How do I track my order?',
    a: 'Open My Orders from your profile, tap any active order to see its live status, or use the Track Order page with your order number. Active orders update in real time as the status changes.',
    topic: 'delivery',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept secure online payments via Paystack. You can pay with your debit card, bank transfer, or USSD through the Paystack checkout at the end of your order.',
    topic: 'payment',
  },
  {
    q: 'Can I cancel an order?',
    a: 'You can request a cancellation by contacting support with your order number before the order is dispatched. Once an order has been accepted, prepared, or is out for delivery, cancellation is no longer available. To request a cancellation, open a support ticket with the category "Cancellation Request" and include your order number.',
    topic: 'refund',
  },
  {
    q: 'How do I request a refund?',
    a: 'To request a refund, open a support ticket from the Support page and select "Refund Request" as the category. Include your order number and a description of the issue. Our team will review your request and respond. Submitting a refund request does not guarantee a refund will be processed — each request is reviewed individually.',
    topic: 'refund',
  },
  {
    q: 'What if my order is missing, damaged or incorrect?',
    a: 'If your order arrives with missing items, damaged products, or incorrect items, open a support ticket within 24 hours of delivery. Select the appropriate category (Missing Item, Damaged Item, or Wrong Item) and include your order number along with a description of the problem. Providing photos or details of the affected items helps us resolve your issue faster.',
    topic: 'quality',
  },
  {
    q: 'What should I do about product freshness or quality concerns?',
    a: 'If you have concerns about the freshness or quality of a product you received, please open a support ticket with the category "Product Quality" within 24 hours of delivery. Include the product name, your order number, and a description of the issue. Our team will review your concern and respond with a resolution.',
    topic: 'quality',
  },
  {
    q: 'How do I create an account?',
    a: 'Tap "Create Account" on the login screen. Enter your name, email, phone number, and password. You will receive a verification code by email to activate your account. Once verified, you can start shopping immediately.',
    topic: 'account',
  },
  {
    q: 'How do I update my personal information?',
    a: 'Go to your Profile, then tap "Edit Profile". You can update your full name, phone number, and date of birth. To change your email address, please contact support — email changes require verification for security.',
    topic: 'account',
  },
  {
    q: 'How do I change my phone number?',
    a: 'Go to Profile, then Edit Profile, and update your phone number in the phone field. Make sure to enter a valid Nigerian phone number (starting with 070, 080, 081, 090, or 091).',
    topic: 'account',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen, tap "Forgot Password" and enter your email address. A password reset link will be sent to your email. Open the link and enter your new password. If you do not receive the email, check your spam folder or contact support.',
    topic: 'account',
  },
  {
    q: 'How do I manage my saved addresses?',
    a: 'Go to Profile, then tap "Saved Addresses". You can add, edit, or delete saved addresses. Each address can be labelled as Home, Work, or Other. You can also set a default address for faster checkout.',
    topic: 'account',
  },
  {
    q: 'How do I apply a promo code?',
    a: 'During checkout, enter your promo code in the voucher field and tap apply. If the code is valid, the discount will be reflected in your order total before you pay.',
    topic: 'promo',
  },
  {
    q: 'Why is my promo code not working?',
    a: 'A promo code may not work if it has expired, has already been used, does not meet the minimum order value, or is not valid for the items in your cart. Check the terms of the promotion and try again. If you believe the code should be valid, contact support.',
    topic: 'promo',
  },
  {
    q: 'How do promotional discounts appear at checkout?',
    a: 'When a valid promo code is applied, the discount amount is shown in your checkout summary alongside items total, delivery fee, and total. You will always see the final amount before payment is processed.',
    topic: 'promo',
  },
  {
    q: 'What happens after I submit a refund request?',
    a: 'After you submit a refund request via a support ticket, our team reviews it and responds to you through the ticket. You will be notified when there is a reply. Refund requests are reviewed case by case — submitting a request does not automatically trigger a refund.',
    topic: 'refund',
  },
  {
    q: 'How do I contact support about a refund?',
    a: 'Open a support ticket from the Support page and select "Refund Request" as the category. Include your order number and details of the issue. You can track the conversation and respond to staff replies directly in the ticket chat.',
    topic: 'refund',
  },
  {
    q: 'What email verification do I need?',
    a: 'When you create an account, a six-digit verification code is sent to your email. Enter this code on the verification screen to activate your account. If you did not receive the code, tap "Resend code" on the verification screen.',
    topic: 'account',
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
  const [query, setQuery] = useState('');
  const { getField, isSectionVisible } = usePageContent('support');

  const supportEmail = getField('contact_email', SUPPORT_EMAIL);

  const filtered = FAQS.filter((f) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (f.q + ' ' + f.a).toLowerCase().includes(q);
  });

  return (
    <div className="uk-page space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help topics..."
          className="w-full pl-10 pr-4 h-12 rounded-full bg-card border border-gray-200 text-sm outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all"
        />
      </div>

      {/* Popular topics */}
      {isSectionVisible('faq', true) && (
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
                    : 'border-border bg-card'
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
      )}

      {/* FAQ */}
      {isSectionVisible('faq', true) && (
      <div>
        <h2 className="text-sm font-bold text-[#1a2238] mb-2 px-1">
          Frequently Asked Questions
        </h2>
        {filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No articles match your search. Try a different keyword or contact support.
            </p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="bg-card rounded-2xl border border-border px-4"
          >
            {filtered.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-gray-50 last:border-0"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground text-left py-4">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
      )}

      {/* Still need help */}
      {isSectionVisible('contact', true) && (
      <div>
        <h2 className="text-sm font-bold text-[#1a2238] mb-2 px-1">
          Still need help?
        </h2>
        <div className="bg-card rounded-2xl border border-border divide-y divide-gray-50">
          <Link
            to="/tickets"
            className="flex items-center gap-3 p-4 active:bg-muted/50"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EEF8EE] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#2E7D32]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Chat with our support team
              </p>
              <p className="text-xs text-muted-foreground">
                Open a ticket, we reply fast
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          <a
            href={`mailto:${supportEmail}`}
            className="flex items-center gap-3 p-4 active:bg-muted/50"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EEF8EE] flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#2E7D32]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Email Support</p>
              <p className="text-xs text-muted-foreground">Reply within 24h</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </a>
        </div>
      </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Contact us at{' '}
        <a
          href={`mailto:${supportEmail}`}
          className="text-[#2E7D32] font-medium"
        >
          {supportEmail}
        </a>
      </p>
    </div>
  );
}
