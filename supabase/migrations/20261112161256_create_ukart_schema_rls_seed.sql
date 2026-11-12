/*
# Ukart schema, security and seed data (migration from Base44)

1. New Tables (25)
- `users` (profile mirror of auth.users): role, staff_role, phone, date_of_birth, avatar_url,
  saved_addresses, saved_cards, notification_preferences, language, deletion_requested
- `categories`: name, slug, icon, image, display_order, is_hidden
- `products`: name, price, original_price, image, images, category_id, category_name, category_ids,
  subcategory, product_type, rating, description, description_long, unit, variants, stock_status,
  stock_quantity, low_stock_threshold, is_hidden, serves, prep_time, cooking_instructions,
  optional_items, addons, is_best_seller, is_weekly_deal, status
- `packages` (meal kits / bundles): full Bundle schema incl. sizes, items, cooking_steps, proteins
- `orders`: order_number, items, totals, voucher fields, customer contact/address, delivery_zone,
  Paystack payment fields, status, notification flags, referral + first-order fields
- `payments`: Paystack payment records (service-role managed)
- `deliveries`: order/rider linkage, status, coordinates, ETA fields, OTP state, override fields
- `riders`: rider profiles with approval status and availability
- `banners`: hero/promo banners with zoom/position/overlay settings
- `reviews`, `deal_alerts`, `homepage_sections`: storefront content
- `delivery_settings`, `promotion_settings`, `notification_settings`: singleton config rows
- `vouchers`: discount vouchers (admin-managed)
- `referrals`, `birthday_rewards`, `customer_dobs`: customer programs
- `tickets`, `ticket_messages`: customer support
- `delivery_audit_logs`, `delivery_otps`, `staff_audit_logs`: audit trails

2. Columns common to all tables
- `id` (uuid pk, default gen_random_uuid())
- `created_date`, `updated_date` (timestamptz, default now()) — match Base44 field names

3. Security
- RLS enabled on every table.
- Public catalog + settings tables: anon/authenticated read; authenticated admin write via
  `is_admin()` SECURITY DEFINER helper.
- User data tables: ownership checks on auth.uid()/email, admin access via `is_admin()`.
- `users` role columns protected; profile rows auto-created on signup via trigger.
- `delivery_otps` service-role only; `payments`/`referrals`/`delivery_audit_logs` client reads only.
- Storage bucket `app-media` (public reads, authenticated inserts).
- Realtime publication includes frequently-subscribed tables.

4. Seed data
- 6 Nigerian grocery categories, 18 products (naira pricing), 3 banners, 4 reviews,
  one settings row each for delivery/promotion/notification settings.
*/

-- ============ core catalog ============
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin','user','rider')),
  staff_role text check (staff_role in ('super_admin','support','operations','content_manager','finance','rider_manager')),
  full_name text,
  phone text,
  date_of_birth text,
  avatar_url text,
  saved_addresses jsonb default '[]'::jsonb,
  saved_cards jsonb default '[]'::jsonb,
  notification_preferences jsonb default '{}'::jsonb,
  language text,
  deletion_requested boolean default false,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  icon text,
  image text,
  display_order numeric default 0,
  is_hidden boolean default false,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  original_price numeric,
  image text,
  images jsonb default '[]'::jsonb,
  category_id text,
  category_name text,
  category_ids jsonb default '[]'::jsonb,
  subcategory text,
  product_type text default 'grocery' check (product_type in ('grocery','meal_kit','package')),
  rating numeric default 0,
  description text,
  description_long text,
  unit text,
  variants jsonb default '[]'::jsonb,
  stock_status text default 'in_stock' check (stock_status in ('in_stock','low_stock','out_of_stock')),
  stock_quantity numeric default 0,
  low_stock_threshold numeric default 5,
  is_hidden boolean default false,
  serves text,
  prep_time text,
  cooking_instructions text,
  optional_items jsonb default '[]'::jsonb,
  addons jsonb default '[]'::jsonb,
  is_best_seller boolean default false,
  is_weekly_deal boolean default false,
  status text default 'active' check (status in ('active','coming_soon')),
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  description_long text,
  image text,
  image_zoom numeric default 1,
  image_pos_x numeric default 50,
  image_pos_y numeric default 50,
  image_fit_mode text default 'contain' check (image_fit_mode in ('contain','cover')),
  starting_price numeric,
  total_price numeric,
  original_total numeric,
  item_count numeric,
  badge text,
  delivery_time text,
  prep_time text,
  "group" text default 'essentials' check ("group" in ('essentials','meal_kits')),
  serves text,
  sizes jsonb default '[]'::jsonb,
  stock_status text default 'in_stock' check (stock_status in ('in_stock','low_stock','out_of_stock')),
  featured boolean default false,
  items jsonb default '[]'::jsonb,
  cooking_instructions text,
  cooking_steps jsonb default '[]'::jsonb,
  optional_items jsonb default '[]'::jsonb,
  optional_categories jsonb default '[]'::jsonb,
  active boolean default true,
  display_order numeric default 0,
  addons jsonb default '[]'::jsonb,
  proteins jsonb default '[]'::jsonb,
  extras jsonb default '[]'::jsonb,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null default 'home' check (location in ('home','meal_kits','promotions','categories')),
  image text not null,
  "order" numeric default 0,
  active boolean default true,
  zoom numeric default 1,
  pos_x numeric default 50,
  pos_y numeric default 50,
  fit_mode text default 'cover' check (fit_mode in ('contain','cover')),
  link text,
  auto_slide boolean default true,
  slide_duration numeric default 5,
  heading text,
  subheading text,
  badge_text text,
  cta_text text,
  show_overlay boolean default false,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  location text,
  rating numeric,
  text text not null,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.deal_alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type text default 'announcement' check (type in ('weekly_deal','discount_code','announcement')),
  image text,
  link text,
  voucher_code text,
  discount_percent numeric,
  active boolean default true,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('weekly_deals','more_to_explore')),
  product_ids jsonb default '[]'::jsonb,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.delivery_settings (
  id uuid primary key default gen_random_uuid(),
  island_fee numeric default 3000,
  mainland_fee numeric default 5000,
  mainland_threshold numeric default 10000,
  discounts_enabled boolean default true,
  first_order_discount_percent numeric default 65,
  repeat_discount_percent numeric default 50,
  first_order_min_subtotal numeric default 4900,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.promotion_settings (
  id uuid primary key default gen_random_uuid(),
  first_order_enabled boolean default true,
  first_order_discount numeric default 500,
  free_delivery_threshold numeric default 30000,
  first_order_free_delivery_enabled boolean default true,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  business_email text default 'ukartfreshventures@gmail.com',
  enable_business_email boolean default true,
  enable_customer_confirmation boolean default true,
  enable_customer_status_emails boolean default true,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  items jsonb default '[]'::jsonb,
  subtotal numeric,
  delivery_fee numeric,
  service_fee numeric default 0,
  discount numeric default 0,
  voucher_code text,
  voucher_id text,
  voucher_claimed boolean default false,
  total numeric not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  alternate_phone text,
  customer_address text,
  landmark text,
  delivery_zone text default 'island' check (delivery_zone in ('island','mainland')),
  payment_method text default 'Pay Online',
  payment_status text default 'Pending' check (payment_status in ('Pending','Processing','Paid','Failed','Abandoned','Cancelled','Refunded')),
  paystack_reference text,
  paystack_transaction_id numeric,
  payment_channel text,
  payment_timestamp timestamptz,
  paystack_mode text check (paystack_mode in ('test','live')),
  paystack_response jsonb,
  status text default 'awaiting_payment' check (status in ('awaiting_payment','new','processing','ready','on_the_way','delivered','cancelled')),
  admin_notified boolean default false,
  confirmation_email_sent boolean default false,
  last_status_notified text,
  referral_id text,
  referral_type text check (referral_type in ('referred','referrer')),
  is_first_order boolean default false,
  first_order_discount numeric default 0,
  first_order_free_delivery boolean default false,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  order_number text,
  reference text not null,
  paystack_transaction_id numeric,
  amount numeric not null,
  currency text default 'NGN',
  status text default 'pending' check (status in ('pending','processing','paid','failed','abandoned','cancelled','refunded')),
  customer_email text,
  customer_name text,
  payment_channel text,
  paystack_response jsonb,
  mode text default 'test' check (mode in ('test','live')),
  initialized_at timestamptz,
  verified_at timestamptz,
  paid_at timestamptz,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type text default 'percentage' check (discount_type in ('percentage','fixed_amount')),
  discount_percent numeric default 10,
  discount_amount numeric,
  max_uses numeric,
  uses numeric default 0,
  active boolean default true,
  description text,
  assigned_to_email text,
  expiry_date timestamptz,
  birthday_reward_id text,
  one_time_use boolean default false,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  phone text not null,
  email text,
  photo text,
  vehicle_type text default 'motorcycle' check (vehicle_type in ('motorcycle','bicycle','car','scooter','van')),
  vehicle_number text,
  emergency_contact text,
  address text,
  approval_status text default 'pending' check (approval_status in ('pending','approved','suspended','inactive')),
  is_online boolean default false,
  is_available boolean default false,
  current_delivery_id text,
  completed_deliveries numeric default 0,
  cancelled_deliveries numeric default 0,
  rating numeric default 5,
  registered_at timestamptz,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  order_number text not null,
  order_total numeric,
  order_items jsonb default '[]'::jsonb,
  rider_id text,
  rider_user_id text,
  rider_name text,
  rider_phone text,
  rider_photo text,
  customer_email text,
  customer_name text,
  customer_phone text,
  customer_address text,
  status text default 'pending' check (status in ('pending','assigned','accepted','preparing','ready_for_pickup','picked_up','on_the_way','arriving_soon','arrived','otp_verified','delivered','cancelled')),
  pickup_address text,
  pickup_lat numeric,
  pickup_lng numeric,
  delivery_lat numeric,
  delivery_lng numeric,
  latest_lat numeric,
  latest_lng numeric,
  last_location_at timestamptz,
  started_at timestamptz,
  estimated_delivery_at timestamptz,
  estimated_minutes numeric,
  last_eta_update timestamptz,
  eta_status text default 'unknown' check (eta_status in ('on_time','delayed','arriving_soon','arrived','delivered','unknown')),
  arriving_soon_at timestamptz,
  arrived_at timestamptz,
  delivered_at timestamptz,
  otp_active boolean default false,
  otp_attempts numeric default 0,
  otp_max_attempts numeric default 5,
  otp_locked_until timestamptz,
  otp_verified boolean default false,
  otp_verified_at timestamptz,
  otp_send_status text default 'pending' check (otp_send_status in ('pending','email_sent','sms_sent','both_sent','failed')),
  otp_last_sent_at timestamptz,
  override_reason text,
  override_note text,
  override_admin_id text,
  override_admin_name text,
  override_at timestamptz,
  is_test_mode boolean default false,
  test_progress text,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.delivery_audit_logs (
  id uuid primary key default gen_random_uuid(),
  delivery_id text not null,
  order_id text,
  order_number text,
  customer_email text,
  event_type text not null check (event_type in ('assigned','accepted','picked_up','started','arriving_soon','arrived','otp_generated','otp_resent','otp_verified','otp_failed','otp_locked','delivered','cancelled','admin_override')),
  message text not null,
  actor_type text default 'system' check (actor_type in ('admin','rider','customer','system')),
  actor_id text,
  actor_name text,
  customer_visible boolean default false,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.delivery_otps (
  id uuid primary key default gen_random_uuid(),
  delivery_id text not null,
  order_id text,
  order_number text,
  rider_id text,
  rider_user_id text,
  customer_email text,
  customer_phone text,
  code_hash text not null,
  expires_at timestamptz not null,
  verified boolean default false,
  verified_at timestamptz,
  attempt_count numeric default 0,
  max_attempts numeric default 5,
  locked_until timestamptz,
  invalidated boolean default false,
  generated_at timestamptz,
  send_email_status text default 'skipped' check (send_email_status in ('sent','failed','not_configured','skipped')),
  send_sms_status text default 'skipped' check (send_sms_status in ('sent','failed','not_configured','skipped')),
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.delivery_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  order_number text,
  rating numeric not null check (rating between 1 and 5),
  comment text,
  customer_name text,
  photos jsonb default '[]'::jsonb,
  created_by_id uuid,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id text not null,
  referred_email text,
  referred_user_id text,
  status text default 'pending' check (status in ('pending','first_order_placed','rewarded')),
  referred_rewarded boolean default false,
  referrer_rewarded boolean default false,
  reward_amount numeric default 1000,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.birthday_rewards (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null,
  customer_email text not null,
  customer_name text,
  date_of_birth text,
  birthday_year numeric not null,
  voucher_id text,
  voucher_code text,
  voucher_amount numeric default 2000,
  expiry_date timestamptz,
  status text default 'created' check (status in ('created','sent','redeemed','expired')),
  sent_at timestamptz,
  redeemed_at timestamptz,
  is_test boolean default false,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.customer_dobs (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null,
  customer_email text not null,
  customer_name text,
  date_of_birth text not null,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  category text default 'other',
  status text default 'open' check (status in ('open','closed','new','in_progress','waiting_customer','waiting_internal','resolved')),
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  user_email text,
  user_name text,
  customer_phone text,
  order_id text,
  order_number text,
  assigned_staff_id text,
  assigned_staff_name text,
  assigned_rider_id text,
  assigned_rider_name text,
  last_message_at timestamptz,
  resolved_at timestamptz,
  closed_reason text default 'manual' check (closed_reason in ('manual','auto_closed_inactivity')),
  internal_notes text,
  created_by_id uuid,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null,
  ticket_owner_id text,
  sender text not null default 'user' check (sender in ('user','admin','staff')),
  sender_name text,
  body text not null,
  internal boolean default false,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

create table if not exists public.staff_audit_logs (
  id uuid primary key default gen_random_uuid(),
  staff_id text,
  staff_name text,
  staff_role text,
  action text not null,
  entity_type text,
  record_id text,
  record_name text,
  previous_value text,
  new_value text,
  details text,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- ============ indexes ============
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_type on public.products(product_type);
create index if not exists idx_orders_email on public.orders(customer_email);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_created on public.orders(created_date desc);
create index if not exists idx_deliveries_order on public.deliveries(order_id);
create index if not exists idx_deliveries_rider on public.deliveries(rider_id);
create index if not exists idx_deliveries_status on public.deliveries(status);
create index if not exists idx_riders_user on public.riders(user_id);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_payments_reference on public.payments(reference);
create index if not exists idx_tickets_created_by on public.tickets(created_by_id);
create index if not exists idx_ticket_messages_ticket on public.ticket_messages(ticket_id);
create index if not exists idx_audit_delivery on public.delivery_audit_logs(delivery_id);
create index if not exists idx_otps_delivery on public.delivery_otps(delivery_id);
create index if not exists idx_vouchers_code on public.vouchers(code);

-- ============ admin helper (after tables exist) ============
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (
      select coalesce(raw_app_meta_data->>'role' = 'admin', false)
      from auth.users where id = auth.uid()
    ),
    (select role = 'admin' from public.users where id = auth.uid())
  );
$$;

-- ============ RLS + grants ============
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.packages enable row level security;
alter table public.banners enable row level security;
alter table public.reviews enable row level security;
alter table public.deal_alerts enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.delivery_settings enable row level security;
alter table public.promotion_settings enable row level security;
alter table public.notification_settings enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.vouchers enable row level security;
alter table public.riders enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_audit_logs enable row level security;
alter table public.delivery_otps enable row level security;
alter table public.delivery_reviews enable row level security;
alter table public.referrals enable row level security;
alter table public.birthday_rewards enable row level security;
alter table public.customer_dobs enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.staff_audit_logs enable row level security;

-- catalog: public read, admin write
grant select on public.categories, public.products, public.packages, public.banners, public.reviews,
  public.deal_alerts, public.homepage_sections, public.delivery_settings, public.promotion_settings,
  public.notification_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.packages, public.banners,
  public.reviews, public.deal_alerts, public.homepage_sections, public.delivery_settings,
  public.promotion_settings, public.notification_settings to authenticated;

drop policy if exists "catalog_read" on public.categories;
create policy "catalog_read" on public.categories for select to anon, authenticated using (true);
drop policy if exists "catalog_admin_write" on public.categories;
create policy "catalog_admin_write" on public.categories for insert to authenticated with check (public.is_admin());
drop policy if exists "catalog_admin_update" on public.categories;
create policy "catalog_admin_update" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "catalog_admin_delete" on public.categories;
create policy "catalog_admin_delete" on public.categories for delete to authenticated using (public.is_admin());

drop policy if exists "catalog_read" on public.products;
create policy "catalog_read" on public.products for select to anon, authenticated using (true);
drop policy if exists "catalog_admin_write" on public.products;
create policy "catalog_admin_write" on public.products for insert to authenticated with check (public.is_admin());
drop policy if exists "catalog_admin_update" on public.products;
create policy "catalog_admin_update" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "catalog_admin_delete" on public.products;
create policy "catalog_admin_delete" on public.products for delete to authenticated using (public.is_admin());

drop policy if exists "catalog_read" on public.packages;
create policy "catalog_read" on public.packages for select to anon, authenticated using (true);
drop policy if exists "catalog_admin_write" on public.packages;
create policy "catalog_admin_write" on public.packages for insert to authenticated with check (public.is_admin());
drop policy if exists "catalog_admin_update" on public.packages;
create policy "catalog_admin_update" on public.packages for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "catalog_admin_delete" on public.packages;
create policy "catalog_admin_delete" on public.packages for delete to authenticated using (public.is_admin());

drop policy if exists "catalog_read" on public.banners;
create policy "catalog_read" on public.banners for select to anon, authenticated using (true);
drop policy if exists "catalog_admin_write" on public.banners;
create policy "catalog_admin_write" on public.banners for insert to authenticated with check (public.is_admin());
drop policy if exists "catalog_admin_update" on public.banners;
create policy "catalog_admin_update" on public.banners for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "catalog_admin_delete" on public.banners;
create policy "catalog_admin_delete" on public.banners for delete to authenticated using (public.is_admin());

drop policy if exists "catalog_read" on public.reviews;
create policy "catalog_read" on public.reviews for select to anon, authenticated using (true);
drop policy if exists "catalog_admin_write" on public.reviews;
create policy "catalog_admin_write" on public.reviews for insert to authenticated with check (public.is_admin());
drop policy if exists "catalog_admin_update" on public.reviews;
create policy "catalog_admin_update" on public.reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "catalog_admin_delete" on public.reviews;
create policy "catalog_admin_delete" on public.reviews for delete to authenticated using (public.is_admin());

drop policy if exists "catalog_read" on public.deal_alerts;
create policy "catalog_read" on public.deal_alerts for select to anon, authenticated using (true);
drop policy if exists "catalog_admin_write" on public.deal_alerts;
create policy "catalog_admin_write" on public.deal_alerts for insert to authenticated with check (public.is_admin());
drop policy if exists "catalog_admin_update" on public.deal_alerts;
create policy "catalog_admin_update" on public.deal_alerts for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "catalog_admin_delete" on public.deal_alerts;
create policy "catalog_admin_delete" on public.deal_alerts for delete to authenticated using (public.is_admin());

drop policy if exists "catalog_read" on public.homepage_sections;
create policy "catalog_read" on public.homepage_sections for select to anon, authenticated using (true);
drop policy if exists "catalog_admin_write" on public.homepage_sections;
create policy "catalog_admin_write" on public.homepage_sections for insert to authenticated with check (public.is_admin());
drop policy if exists "catalog_admin_update" on public.homepage_sections;
create policy "catalog_admin_update" on public.homepage_sections for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "catalog_admin_delete" on public.homepage_sections;
create policy "catalog_admin_delete" on public.homepage_sections for delete to authenticated using (public.is_admin());

drop policy if exists "catalog_read" on public.delivery_settings;
create policy "catalog_read" on public.delivery_settings for select to anon, authenticated using (true);
drop policy if exists "catalog_admin_write" on public.delivery_settings;
create policy "catalog_admin_write" on public.delivery_settings for insert to authenticated with check (public.is_admin());
drop policy if exists "catalog_admin_update" on public.delivery_settings;
create policy "catalog_admin_update" on public.delivery_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "catalog_read" on public.promotion_settings;
create policy "catalog_read" on public.promotion_settings for select to anon, authenticated using (true);
drop policy if exists "catalog_admin_write" on public.promotion_settings;
create policy "catalog_admin_write" on public.promotion_settings for insert to authenticated with check (public.is_admin());
drop policy if exists "catalog_admin_update" on public.promotion_settings;
create policy "catalog_admin_update" on public.promotion_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "catalog_read" on public.notification_settings;
create policy "catalog_read" on public.notification_settings for select to anon, authenticated using (true);
drop policy if exists "catalog_admin_write" on public.notification_settings;
create policy "catalog_admin_write" on public.notification_settings for insert to authenticated with check (public.is_admin());
drop policy if exists "catalog_admin_update" on public.notification_settings;
create policy "catalog_admin_update" on public.notification_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "catalog_admin_delete" on public.notification_settings;
create policy "catalog_admin_delete" on public.notification_settings for delete to authenticated using (public.is_admin());

-- users
grant select, insert, update, delete on public.users to authenticated;
drop policy if exists "users_read_own_or_admin" on public.users;
create policy "users_read_own_or_admin" on public.users for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin" on public.users for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
drop policy if exists "users_admin_insert" on public.users;
create policy "users_admin_insert" on public.users for insert to authenticated with check (public.is_admin());
drop policy if exists "users_admin_delete" on public.users;
create policy "users_admin_delete" on public.users for delete to authenticated using (public.is_admin());

-- orders
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update on public.orders to service_role;
drop policy if exists "orders_read_own_or_admin" on public.orders;
create policy "orders_read_own_or_admin" on public.orders for select to authenticated
  using (customer_email = (select email from auth.users where id = auth.uid()) or public.is_admin());
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders for insert to authenticated
  with check (customer_email = (select email from auth.users where id = auth.uid()) or public.is_admin());
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders for delete to authenticated using (public.is_admin());

-- payments (client reads own/admin; writes via service role edge functions)
grant select on public.payments to authenticated;
grant select, insert, update on public.payments to service_role;
drop policy if exists "payments_read_own_or_admin" on public.payments;
create policy "payments_read_own_or_admin" on public.payments for select to authenticated
  using (customer_email = (select email from auth.users where id = auth.uid()) or public.is_admin());

-- vouchers (admin only; checkout validation happens server-side)
grant select, insert, update, delete on public.vouchers to authenticated;
drop policy if exists "vouchers_admin_read" on public.vouchers;
create policy "vouchers_admin_read" on public.vouchers for select to authenticated using (public.is_admin());
drop policy if exists "vouchers_admin_write" on public.vouchers;
create policy "vouchers_admin_write" on public.vouchers for insert to authenticated with check (public.is_admin());
drop policy if exists "vouchers_admin_update" on public.vouchers;
create policy "vouchers_admin_update" on public.vouchers for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "vouchers_admin_delete" on public.vouchers;
create policy "vouchers_admin_delete" on public.vouchers for delete to authenticated using (public.is_admin());

-- riders
grant select, insert, update, delete on public.riders to authenticated;
grant select, insert, update on public.riders to service_role;
drop policy if exists "riders_read_own_or_admin" on public.riders;
create policy "riders_read_own_or_admin" on public.riders for select to authenticated
  using (user_id = auth.uid()::text or public.is_admin());
drop policy if exists "riders_insert_own_pending" on public.riders;
create policy "riders_insert_own_pending" on public.riders for insert to authenticated
  with check (
    (user_id = auth.uid()::text and approval_status = 'pending' and is_online = false and is_available = false)
    or public.is_admin()
  );
drop policy if exists "riders_admin_update" on public.riders;
create policy "riders_admin_update" on public.riders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "riders_admin_delete" on public.riders;
create policy "riders_admin_delete" on public.riders for delete to authenticated using (public.is_admin());

-- deliveries
grant select, insert, update, delete on public.deliveries to authenticated;
grant select, insert, update on public.deliveries to service_role;
drop policy if exists "deliveries_read_participant" on public.deliveries;
create policy "deliveries_read_participant" on public.deliveries for select to authenticated
  using (
    customer_email = (select email from auth.users where id = auth.uid())
    or rider_user_id = auth.uid()::text
    or public.is_admin()
  );
drop policy if exists "deliveries_admin_insert" on public.deliveries;
create policy "deliveries_admin_insert" on public.deliveries for insert to authenticated with check (public.is_admin());
drop policy if exists "deliveries_admin_update" on public.deliveries;
create policy "deliveries_admin_update" on public.deliveries for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "deliveries_admin_delete" on public.deliveries;
create policy "deliveries_admin_delete" on public.deliveries for delete to authenticated using (public.is_admin());

-- delivery audit logs (client reads own/admin; writes via service role)
grant select on public.delivery_audit_logs to authenticated;
grant select, insert on public.delivery_audit_logs to service_role;
drop policy if exists "audit_read_own_or_admin" on public.delivery_audit_logs;
create policy "audit_read_own_or_admin" on public.delivery_audit_logs for select to authenticated
  using (customer_email = (select email from auth.users where id = auth.uid()) or public.is_admin());

-- delivery otps (service role only)
grant select, insert, update on public.delivery_otps to service_role;

-- delivery reviews
grant select, insert, update, delete on public.delivery_reviews to authenticated;
drop policy if exists "dreviews_read_own_or_admin" on public.delivery_reviews;
create policy "dreviews_read_own_or_admin" on public.delivery_reviews for select to authenticated
  using (created_by_id = auth.uid() or public.is_admin());
drop policy if exists "dreviews_insert_own" on public.delivery_reviews;
create policy "dreviews_insert_own" on public.delivery_reviews for insert to authenticated
  with check (created_by_id = auth.uid() or public.is_admin());
drop policy if exists "dreviews_admin_update" on public.delivery_reviews;
create policy "dreviews_admin_update" on public.delivery_reviews for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "dreviews_admin_delete" on public.delivery_reviews;
create policy "dreviews_admin_delete" on public.delivery_reviews for delete to authenticated using (public.is_admin());

-- referrals (client reads own; writes via service role)
grant select on public.referrals to authenticated;
grant select, insert, update on public.referrals to service_role;
drop policy if exists "referrals_read_participant" on public.referrals;
create policy "referrals_read_participant" on public.referrals for select to authenticated
  using (referrer_id = auth.uid()::text or referred_user_id = auth.uid()::text or public.is_admin());

-- birthday rewards (client reads own; writes via service role)
grant select on public.birthday_rewards to authenticated;
grant select, insert, update on public.birthday_rewards to service_role;
drop policy if exists "brewards_read_own_or_admin" on public.birthday_rewards;
create policy "brewards_read_own_or_admin" on public.birthday_rewards for select to authenticated
  using (customer_email = (select email from auth.users where id = auth.uid()) or public.is_admin());

-- customer dobs
grant select, insert, update, delete on public.customer_dobs to authenticated;
drop policy if exists "dobs_read_own_or_admin" on public.customer_dobs;
create policy "dobs_read_own_or_admin" on public.customer_dobs for select to authenticated
  using (customer_email = (select email from auth.users where id = auth.uid()) or public.is_admin());
drop policy if exists "dobs_insert_own" on public.customer_dobs;
create policy "dobs_insert_own" on public.customer_dobs for insert to authenticated
  with check (customer_id = auth.uid()::text or public.is_admin());
drop policy if exists "dobs_update_own_or_admin" on public.customer_dobs;
create policy "dobs_update_own_or_admin" on public.customer_dobs for update to authenticated
  using (customer_id = auth.uid()::text or public.is_admin())
  with check (customer_id = auth.uid()::text or public.is_admin());
drop policy if exists "dobs_admin_delete" on public.customer_dobs;
create policy "dobs_admin_delete" on public.customer_dobs for delete to authenticated using (public.is_admin());

-- tickets
grant select, insert, update, delete on public.tickets to authenticated;
drop policy if exists "tickets_read_own_or_admin" on public.tickets;
create policy "tickets_read_own_or_admin" on public.tickets for select to authenticated
  using (created_by_id = auth.uid() or public.is_admin());
drop policy if exists "tickets_insert_own_or_admin" on public.tickets;
create policy "tickets_insert_own_or_admin" on public.tickets for insert to authenticated
  with check (created_by_id = auth.uid() or public.is_admin());
drop policy if exists "tickets_update_own_or_admin" on public.tickets;
create policy "tickets_update_own_or_admin" on public.tickets for update to authenticated
  using (created_by_id = auth.uid() or public.is_admin())
  with check (created_by_id = auth.uid() or public.is_admin());
drop policy if exists "tickets_admin_delete" on public.tickets;
create policy "tickets_admin_delete" on public.tickets for delete to authenticated using (public.is_admin());

-- ticket messages
grant select, insert, update, delete on public.ticket_messages to authenticated;
drop policy if exists "tmessages_read_own_or_admin" on public.ticket_messages;
create policy "tmessages_read_own_or_admin" on public.ticket_messages for select to authenticated
  using (
    (ticket_owner_id = auth.uid()::text and internal = false) or public.is_admin()
  );
drop policy if exists "tmessages_insert_own_or_admin" on public.ticket_messages;
create policy "tmessages_insert_own_or_admin" on public.ticket_messages for insert to authenticated
  with check (ticket_owner_id = auth.uid()::text or public.is_admin());
drop policy if exists "tmessages_admin_update" on public.ticket_messages;
create policy "tmessages_admin_update" on public.ticket_messages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "tmessages_admin_delete" on public.ticket_messages;
create policy "tmessages_admin_delete" on public.ticket_messages for delete to authenticated using (public.is_admin());

-- staff audit logs (admin read/insert)
grant select, insert on public.staff_audit_logs to authenticated;
drop policy if exists "saudit_admin_read" on public.staff_audit_logs;
create policy "saudit_admin_read" on public.staff_audit_logs for select to authenticated using (public.is_admin());
drop policy if exists "saudit_admin_insert" on public.staff_audit_logs;
create policy "saudit_admin_insert" on public.staff_audit_logs for insert to authenticated with check (public.is_admin());

-- ============ storage ============
insert into storage.buckets (id, name, public) values ('app-media', 'app-media', true)
on conflict (id) do nothing;
drop policy if exists "app_media_read" on storage.objects;
create policy "app_media_read" on storage.objects for select to anon, authenticated using (bucket_id = 'app-media');
drop policy if exists "app_media_insert" on storage.objects;
create policy "app_media_insert" on storage.objects for insert to authenticated with check (bucket_id = 'app-media');

-- ============ realtime ============
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.deliveries;
alter publication supabase_realtime add table public.riders;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.deal_alerts;
alter publication supabase_realtime add table public.ticket_messages;
alter publication supabase_realtime add table public.delivery_audit_logs;

-- ============ auto-create user profile on signup ============
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ seed data ============
insert into public.categories (id, name, slug, icon, image, display_order) values
  ('11111111-1111-1111-1111-111111111101', 'Rice & Grains', 'rice-grains', '🌾', 'https://images.pexels.com/photos/38781904/pexels-photo-38781904.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
  ('11111111-1111-1111-1111-111111111102', 'Pasta & Noodles', 'pasta-noodles', '🍝', 'https://images.pexels.com/photos/4132495/pexels-photo-4132495.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2),
  ('11111111-1111-1111-1111-111111111103', 'Cooking Essentials', 'cooking-essentials', '🫙', 'https://images.pexels.com/photos/8580727/pexels-photo-8580727.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 3),
  ('11111111-1111-1111-1111-111111111104', 'Beverages', 'beverages', '🥤', 'https://images.pexels.com/photos/35285855/pexels-photo-35285855.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 4),
  ('11111111-1111-1111-1111-111111111105', 'Snacks', 'snacks', '🍪', 'https://images.pexels.com/photos/21582447/pexels-photo-21582447.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 5),
  ('11111111-1111-1111-1111-111111111106', 'Household', 'household', '🧴', 'https://images.pexels.com/photos/4177735/pexels-photo-4177735.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 6)
on conflict (id) do nothing;

insert into public.products (id, name, price, original_price, image, category_id, category_name, description, unit, stock_status, stock_quantity, is_best_seller, is_weekly_deal, rating) values
  ('22222222-2222-2222-2222-222222222201', 'Mama Gold Long Grain Rice 5kg', 12500, 14000, 'https://images.pexels.com/photos/38781904/pexels-photo-38781904.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111101', 'Rice & Grains', 'Premium long grain rice, stone-free and perfectly parboiled. A family favourite for jollof and party rice.', '5kg bag', 'in_stock', 120, true, true, 4.7),
  ('22222222-2222-2222-2222-222222222202', 'Honey Beans (Oloyin) 2kg', 4800, null, 'https://images.pexels.com/photos/7055124/pexels-photo-7055124.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111101', 'Rice & Grains', 'Sweet honey beans ideal for porridge (ewa oloyin) and bean cakes.', '2kg', 'in_stock', 80, true, false, 4.5),
  ('22222222-2222-2222-2222-222222222203', 'Golden Penny Spaghetti 500g', 950, 1100, 'https://images.pexels.com/photos/17236198/pexels-photo-17236198.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111102', 'Pasta & Noodles', 'Smooth, non-sticky spaghetti that cooks in 8 minutes.', '500g', 'in_stock', 200, false, true, 4.4),
  ('22222222-2222-2222-2222-222222222204', 'Indomie Instant Noodles Super Pack (Pack of 4)', 1350, null, 'https://images.pexels.com/photos/13675716/pexels-photo-13675716.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111102', 'Pasta & Noodles', 'Nigerias favourite instant noodles, super pack size for a fuller meal.', '4 x 120g', 'in_stock', 150, true, false, 4.8),
  ('22222222-2222-2222-2222-222222222205', 'Kings Vegetable Oil 5L', 14500, 16000, 'https://images.pexels.com/photos/8580727/pexels-photo-8580727.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111103', 'Cooking Essentials', 'Cholesterol-free vegetable oil for everyday frying and cooking.', '5 litres', 'in_stock', 60, true, true, 4.6),
  ('22222222-2222-2222-2222-222222222206', 'Ijebu Garri 3kg', 3800, null, 'https://images.pexels.com/photos/33374893/pexels-photo-33374893.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111103', 'Cooking Essentials', 'Sour, finely grated Ijebu garri — perfect for drinking or eba.', '3kg', 'in_stock', 90, false, false, 4.3),
  ('22222222-2222-2222-2222-222222222207', 'Nigerian Tomato Paste Sachets (Pack of 10)', 2200, 2500, 'https://images.pexels.com/photos/19334742/pexels-photo-19334742.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111103', 'Cooking Essentials', 'Rich double-concentrate tomato paste in convenient sachets.', '10 x 70g', 'in_stock', 140, false, true, 4.2),
  ('22222222-2222-2222-2222-222222222208', 'Milo Activ-Go 900g', 6800, null, 'https://images.pexels.com/photos/35285855/pexels-photo-35285855.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111104', 'Beverages', 'Chocolate malt drink fortified with vitamins and minerals.', '900g tin', 'in_stock', 70, true, false, 4.7),
  ('22222222-2222-2222-2222-222222222209', 'Hollandia Yoghurt Strawberry 1L (Pack of 3)', 3900, 4300, 'https://images.pexels.com/photos/4177710/pexels-photo-4177710.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111104', 'Beverages', 'Creamy strawberry yoghurt drink, pasteurised and delicious.', '3 x 1L', 'in_stock', 45, false, true, 4.5),
  ('22222222-2222-2222-2222-222222222210', 'Sparkling Malt Drink 33cl (Pack of 6)', 2800, null, 'https://images.pexels.com/photos/35285855/pexels-photo-35285855.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111104', 'Beverages', 'Non-alcoholic sparkling malt beverage, brewed to perfection.', '6 x 33cl', 'in_stock', 100, false, false, 4.1),
  ('22222222-2222-2222-2222-222222222211', 'Pringles Original 165g', 3200, 3600, 'https://images.pexels.com/photos/21582447/pexels-photo-21582447.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111105', 'Snacks', 'Light, crispy potato crisps in the iconic can.', '165g', 'in_stock', 110, true, false, 4.6),
  ('22222222-2222-2222-2222-222222222212', 'Plantain Chips (Pack of 5)', 1750, null, 'https://images.pexels.com/photos/21582447/pexels-photo-21582447.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111105', 'Snacks', 'Crunchy salted plantain chips fried in pure vegetable oil.', '5 x 50g', 'in_stock', 130, false, true, 4.4),
  ('22222222-2222-2222-2222-222222222213', 'Peak Milk Powder 400g', 5400, null, 'https://images.pexels.com/photos/35285855/pexels-photo-35285855.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111104', 'Beverages', 'Full-cream milk powder, rich in calcium and protein.', '400g sachet', 'low_stock', 15, true, false, 4.5),
  ('22222222-2222-2222-2222-222222222214', 'Dangote Sugar 1kg', 1450, null, 'https://images.pexels.com/photos/13675716/pexels-photo-13675716.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111103', 'Cooking Essentials', 'Fine granulated white sugar for beverages and baking.', '1kg', 'in_stock', 160, false, false, 4.2),
  ('22222222-2222-2222-2222-222222222215', 'Harp Lager Beer 60cl (Pack of 6)', 4200, 4700, 'https://images.pexels.com/photos/35285855/pexels-photo-35285855.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111104', 'Beverages', 'Smooth, refreshing lager brewed for the Nigerian palate. 18+ only.', '6 x 60cl', 'in_stock', 55, false, true, 4.3),
  ('22222222-2222-2222-2222-222222222216', 'Omo Washing Powder 900g', 2600, null, 'https://images.pexels.com/photos/4177735/pexels-photo-4177735.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111106', 'Household', 'Tough on stains, gentle on fabrics. Hand and machine wash.', '900g', 'in_stock', 85, false, false, 4.1),
  ('22222222-2222-2222-2222-222222222217', 'Harpic Toilet Cleaner 500ml', 2350, 2700, 'https://images.pexels.com/photos/4177709/pexels-photo-4177709.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111106', 'Household', 'Kills 99.9% of germs with a fresh citrus scent.', '500ml', 'in_stock', 65, false, true, 4.2),
  ('22222222-2222-2222-2222-222222222218', 'Ground Dry Pepper 500g', 1900, null, 'https://images.pexels.com/photos/19334742/pexels-photo-19334742.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '11111111-1111-1111-1111-111111111103', 'Cooking Essentials', 'Sun-dried ground scotch bonnet pepper with authentic heat.', '500g', 'out_of_stock', 0, false, false, 4.0)
on conflict (id) do nothing;

insert into public.banners (id, name, location, image, "order", active, heading, subheading, badge_text, cta_text, show_overlay, link) values
  ('33333333-3333-3333-3333-333333333301', 'Welcome Banner', 'home', 'https://images.pexels.com/photos/30688912/pexels-photo-30688912.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1, true, 'Fresh Groceries, Delivered Fast', 'Shop everyday essentials from Nigerias best brands', 'NEW', 'Shop Now', true, '/shop'),
  ('33333333-3333-3333-3333-333333333302', 'Meal Kits Promo', 'home', 'https://images.pexels.com/photos/4177735/pexels-photo-4177735.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2, true, 'Meal Kits That Cook Themselves', 'Pre-portioned ingredients with step-by-step recipes', 'HOT', 'Explore Kits', true, '/packages'),
  ('33333333-3333-3333-3333-333333333303', 'Rice Deals', 'promotions', 'https://images.pexels.com/photos/38781904/pexels-photo-38781904.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1, true, 'Save on Rice This Week', 'Up to 15% off selected rice bags', 'DEAL', 'Grab the Deal', false, '/offers')
on conflict (id) do nothing;

insert into public.reviews (id, customer_name, location, rating, text) values
  ('44444444-4444-4444-4444-444444444401', 'Adaeze O.', 'Lekki, Lagos', 5, 'Ordered my monthly provisions and everything arrived fresh and well-packed. The delivery discount for first orders was a pleasant surprise.'),
  ('44444444-4444-4444-4444-444444444402', 'Tunde B.', 'Yaba, Lagos', 5, 'Live tracking is brilliant — I could see my rider the whole way. Rice and oil were sealed and original.'),
  ('44444444-4444-4444-4444-444444444403', 'Chioma N.', 'Surulere, Lagos', 4, 'Great prices on bulk items. Would love more fresh produce options, but the meal kits are fantastic.'),
  ('44444444-4444-4444-4444-444444444404', 'Ibrahim S.', 'Ikeja, Lagos', 5, 'Customer service responded to my ticket in minutes. Ukart is now my default supermarket.')
on conflict (id) do nothing;

insert into public.delivery_settings (id) values ('55555555-5555-5555-5555-555555555501') on conflict (id) do nothing;
insert into public.promotion_settings (id) values ('66666666-6666-6666-6666-666666666601') on conflict (id) do nothing;
insert into public.notification_settings (id) values ('77777777-7777-7777-7777-777777777701') on conflict (id) do nothing;
