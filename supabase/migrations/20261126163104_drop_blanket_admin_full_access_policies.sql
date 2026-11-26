/*
  # Remove blanket "Admin full access" policies

  1. Security
    - Every application table carried a policy named "Admin full access on <table>"
      defined as FOR ALL TO authenticated USING (true) WITH CHECK (true).
    - Because permissive policies combine with OR, that policy gave EVERY signed-in
      user full read/write/delete on every row, defeating the correct ownership and
      admin policies that already exist on the same tables.
    - This migration drops those policies only. All granular policies
      (catalog_read, *_own_or_admin, *_admin_update, etc.) remain in place, so
      customers keep access to their own rows and admins keep access through
      is_admin().

  2. Notes
    - delivery_otps is left with no policies on purpose: the OTP flow runs entirely
      through service-role edge functions and must not be reachable from browsers.
*/

DROP POLICY IF EXISTS "Admin full access on banners" ON public.banners;
DROP POLICY IF EXISTS "Admin full access on birthday_rewards" ON public.birthday_rewards;
DROP POLICY IF EXISTS "Admin full access on categories" ON public.categories;
DROP POLICY IF EXISTS "Admin full access on customer_dobs" ON public.customer_dobs;
DROP POLICY IF EXISTS "Admin full access on deal_alerts" ON public.deal_alerts;
DROP POLICY IF EXISTS "Admin full access on deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Admin full access on delivery_audit_logs" ON public.delivery_audit_logs;
DROP POLICY IF EXISTS "Admin full access on delivery_otps" ON public.delivery_otps;
DROP POLICY IF EXISTS "Admin full access on delivery_reviews" ON public.delivery_reviews;
DROP POLICY IF EXISTS "Admin full access on delivery_settings" ON public.delivery_settings;
DROP POLICY IF EXISTS "Admin full access on homepage_sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admin full access on notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Admin full access on orders" ON public.orders;
DROP POLICY IF EXISTS "Admin full access on packages" ON public.packages;
DROP POLICY IF EXISTS "Admin full access on page_contents" ON public.page_contents;
DROP POLICY IF EXISTS "Admin full access on payments" ON public.payments;
DROP POLICY IF EXISTS "Admin full access on products" ON public.products;
DROP POLICY IF EXISTS "Admin full access on promotion_settings" ON public.promotion_settings;
DROP POLICY IF EXISTS "Admin full access on referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admin full access on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin full access on riders" ON public.riders;
DROP POLICY IF EXISTS "Admin full access on staff_audit_logs" ON public.staff_audit_logs;
DROP POLICY IF EXISTS "Admin full access on ticket_messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admin full access on tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admin full access on users" ON public.users;
DROP POLICY IF EXISTS "Admin full access on vouchers" ON public.vouchers;
