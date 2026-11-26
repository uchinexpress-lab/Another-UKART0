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

const TERMS = `1. Introduction
These Terms & Conditions govern your access to and use of the Ukart website and services. Ukart is a grocery and food-commerce platform operated by UKART Fresh Ventures in Lagos, Nigeria. By accessing the platform or placing an order, you agree to these terms.

2. Our Services
Ukart provides access to fresh groceries, food essentials, meal kits and curated grocery packages. Orders may involve sourcing products from independent market vendors and suppliers. All products are subject to availability.

3. Delivery Locations and Times
Ukart currently serves selected locations in Lagos, Nigeria.

Lagos Island: Express delivery with a target delivery time of approximately 30 minutes for eligible locations and orders.

These are estimated delivery times, not guaranteed deadlines. Traffic, weather, order volume, sourcing requirements and rider availability may affect delivery.

Customers must provide accurate contact information, delivery addresses and landmarks and remain available to receive their orders.

4. Orders and Confirmation
Submitting an order constitutes a request to purchase. An order is considered confirmed when Ukart has accepted it and the customer receives an order confirmation through the platform or another official communication channel.

Ukart may contact customers to clarify order details or resolve availability issues before fulfilment begins. Customers should not assume an order is confirmed solely because a payment attempt has started.

5. Product Availability and Substitutions
Products are subject to market availability. If an item becomes unavailable, Ukart will contact the customer and explain the available alternatives.

No substitute product should be supplied without the customer's approval. Where a replacement has a different price, the order total must be adjusted and communicated before fulfilment.

If the customer declines a proposed replacement, the unavailable item will be removed from the order and any applicable refund will be handled under the refund policy below.

6. Pricing, Delivery Fees and Market Run Fees
All prices are displayed in Nigerian Naira (₦). Product prices and applicable charges will be shown during checkout.

Delivery fees and any applicable Market Run Fees are separate charges and will be displayed before the customer completes payment. Customers are responsible for reviewing the order summary before confirming payment.

7. Payments
Online payments are processed through Paystack. Ukart does not require customers to disclose their card PIN, password or banking credentials to Ukart.

An order is not considered paid merely because a payment page has opened. Payment confirmation is subject to successful verification through the payment provider.

If a payment fails, remains pending or is debited without the order being confirmed, customers should contact Ukart support with their payment reference. Customers should not make another payment until the original transaction has been checked.

Duplicate successful payments for the same order will be reviewed and any confirmed duplicate payment will be refunded.

8. Cancellations
Customers may request cancellation before an order has been dispatched by contacting Ukart support and providing their order number.

Once an order has been dispatched, cancellation may no longer be possible. Any cancellation request will be assessed based on the order's fulfilment stage and the circumstances involved.

Where Ukart cancels an order or cannot fulfil a paid order, the customer will be informed and an applicable refund will be processed.

9. Refunds and Returns
Customers may request a refund review in situations including:

An order or item was paid for but could not be supplied.

The wrong product was delivered.

An item arrived damaged or was materially different from what was ordered.

An order was cancelled by Ukart after payment.

A duplicate payment was successfully collected.

A payment was debited but the order was not successfully confirmed or fulfilled.

Customers should contact Ukart support with their order number, payment reference where applicable, a description of the issue and supporting photographs where relevant.

Product quality or freshness concerns should be reported within 24 hours of delivery to allow Ukart to investigate.

Every request will be reviewed before a refund is approved. Where a refund is approved, Ukart will initiate processing within 1–3 working days after approval. Refunds will be returned through the original payment method where possible.

The time taken for funds to reflect in the customer's account may depend on Paystack, the payment provider or the customer's bank and may be outside Ukart's control.

10. Customer Responsibilities
Customers must provide accurate order and delivery information, use the platform lawfully and ensure someone is available to receive the order. Customers should report order issues promptly and must not misuse the platform or attempt fraudulent transactions.

11. Service Availability
Ukart may temporarily suspend or limit services due to maintenance, technical problems, market conditions, operational limitations or circumstances beyond its reasonable control. Where possible, affected customers will be notified.

12. Limitation of Responsibility
Ukart will take reasonable care to source, prepare and deliver orders as described. However, delivery estimates may be affected by circumstances outside its control. Nothing in these terms excludes rights or protections that cannot legally be excluded under applicable law.

13. Changes to These Terms
Ukart may update these Terms & Conditions when its services, operations or legal obligations change. Significant changes will be communicated through the website, app or another appropriate customer communication channel. The updated effective date will be displayed on this page.

14. Contact and Support
For questions, cancellations, payment issues or refund requests, customers should contact Ukart through the official support contact details displayed on the platform.

15. Governing Law
These Terms & Conditions are governed by the applicable laws of the Federal Republic of Nigeria.`;

const PRIVACY_POLICY = `Effective Date: 1 December 2026

1. Introduction

UKART Fresh Ventures ("Ukart", "we", "our" or "us") operates Ukart, an online shopping platform for fresh groceries, food essentials, meal kits and grocery packages, serving selected locations in Lagos, Nigeria.

We respect your privacy and are committed to handling your personal information responsibly. This Privacy Policy explains what information we collect, how we use it, when we share it and the rights available to you when you use our website, application and services.

By using Ukart, you acknowledge this Privacy Policy.

2. Information We Collect

Depending on how you use our platform, we may collect the following information:

Personal details: Your name and other account or profile information you provide.

Contact information: Your email address and phone number.

Delivery information: Your delivery address, location details and landmarks.

Order information: Products purchased, grocery packages, meal kit selections, order history and order preferences.

Payment information: Transaction references, payment status, amounts and related payment records required to verify and manage transactions.

Customer support information: Messages, complaints, enquiries, feedback and other information you provide when contacting our support team.

Technical information: Information generated through your use of the platform, where collected, such as device or application information necessary for security and operation.

We collect information that is necessary for providing and improving our services.

3. How We Use Your Information

We use your information for legitimate business and service purposes, including to:

Create and manage your customer account.

Process and fulfil grocery orders.

Coordinate product sourcing, packaging and delivery.

Verify payments and manage refunds.

Send order confirmations, delivery updates and service notifications.

Respond to customer enquiries, complaints and support requests.

Maintain platform security and help prevent fraudulent transactions.

Maintain transaction records and resolve disputes.

Improve the performance and reliability of our services where applicable.

4. Payment Information

Online payments on Ukart are processed through Paystack, our payment processing provider.

Ukart does not directly process or store your full payment card number, card PIN or banking password. Payment information is handled through Paystack's payment infrastructure.

We may retain transaction references, payment status, payment amounts and relevant order records to confirm transactions, reconcile payments, investigate payment issues and manage refunds.

Your use of Paystack's payment services may also be subject to Paystack's own privacy policy and terms.

5. How We Share Your Information

We do not sell or rent your personal information to third parties.

However, certain information may be shared with service providers and partners where necessary to operate Ukart and fulfil your orders.

These may include:

Paystack: Relevant payment and transaction information is shared to process payments and verify transactions.

Supabase: Information may be stored and processed through Supabase, which provides backend infrastructure, database and related technical services for the platform.

Delivery partners and assigned riders: Relevant customer names, phone numbers, delivery addresses and order details may be shared to coordinate and complete deliveries.

Vendors and market-sourcing partners: Relevant order and product information may be shared where necessary to source and prepare items requested by customers.

Legal and regulatory authorities: Information may be disclosed where required by applicable law, regulation or a lawful request.

We aim to limit information shared with each party to what is reasonably necessary for the relevant purpose.

6. Data Protection and Security

We take reasonable technical and organisational measures to protect personal information against unauthorised access, loss, misuse, alteration or disclosure.

These measures may include access controls, appropriate security practices and the use of trusted service providers.

Although we take reasonable steps to protect your information, no online platform or method of electronic storage can be guaranteed to be completely secure.

7. Data Retention

We retain personal information only for as long as reasonably necessary to provide our services and fulfil the purposes described in this policy.

This may include retaining information for:

Customer account management.

Order processing and delivery records.

Payment verification and reconciliation.

Refunds, complaints and customer support.

Legal, regulatory and business record-keeping obligations.

Fraud prevention and dispute resolution.

When information is no longer required, we will take reasonable steps to delete, anonymise or securely dispose of it, subject to applicable legal and operational requirements.

8. Your Privacy Rights

Subject to applicable Nigerian data protection laws, you may have the right to:

Request access to personal information we hold about you.

Request correction of inaccurate or incomplete information.

Request deletion of your personal information where legally permitted.

Ask how your personal information is being used.

Object to or request restrictions on certain forms of processing where applicable.

Withdraw consent where processing is based on your consent.

To exercise these rights, contact Ukart through the official support contact details displayed on our platform.

We may need to verify your identity before responding to certain requests.

9. Cookies and Similar Technologies

Our website or application may use essential technical storage or similar technologies required for functions such as account sessions, security and platform operation.

Where cookies, analytics or other tracking technologies are used, their purpose and relevant information will be communicated through appropriate platform notices or settings.

10. Children's Privacy

Ukart is a general grocery and food-commerce platform. We do not knowingly seek to collect personal information from children without an appropriate authorisation or lawful basis.

Where we become aware that personal information has been collected unlawfully from a child, we will take reasonable steps to address the issue in accordance with applicable law.

11. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our services, information-handling practices or legal obligations.

Where significant changes are made, we will take reasonable steps to notify customers through the website, application or another appropriate communication channel.

The latest effective date will always be displayed at the beginning of this policy. We encourage customers to review it periodically.

12. Contact Us

If you have questions about this Privacy Policy, wish to exercise your privacy rights or have concerns about how your information is handled, please contact Ukart through the official customer support contact details displayed on our website or application.

UKART FRESH VENTURES
Lagos, Nigeria.

13. Applicable Law

This Privacy Policy is interpreted in accordance with applicable laws and regulations of the Federal Republic of Nigeria, including the Nigeria Data Protection Act 2023 and other applicable data protection requirements.`;

export default function About() {
  const { getField, isSectionVisible } = usePageContent('about');

  const title = getField('title', 'UKART');
  const subtitle = getField('subtitle', 'No Market Wahala');
  const description = getField('description',
    'UKART is a household shopping platform making it easier for Nigerian households to access groceries and everyday essentials without the market wahala. We help customers access fresh groceries, food essentials and thoughtfully curated meal kits without the stress of visiting multiple markets or spending hours sourcing ingredients. From individual grocery purchases to ready-made grocery packages for students, busy professionals and families, Ukart makes it easier to shop according to your needs and budget. Ukart currently serves customers across selected locations in Lagos, Nigeria. Through our market-sourcing network, we work with vendors and local suppliers to source fresh produce, proteins, grains, tubers and other household food essentials. Our meal kits and grocery packages bring selected ingredients together, helping customers save time and simplify meal preparation. With convenient ordering and coordinated delivery, Ukart brings the market closer to your doorstep.'
  );
  const contactEmail = getField('contact_email', 'support@ukart.ng');
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
              {PRIVACY_POLICY}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <p className="text-center text-xs text-gray-400">© 2026 UKART Fresh Ventures. All rights reserved.</p>
    </div>
  );
}