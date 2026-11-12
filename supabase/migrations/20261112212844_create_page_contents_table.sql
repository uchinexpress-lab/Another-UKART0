/*
# Create page_contents table for CMS Editor

1. Purpose
   Stores editable text, headings, images, and section-visibility flags for
   every customer-facing page in the app. The Admin "Page Content / CMS Editor"
   reads and writes this table; frontend pages read it dynamically and fall
   back to hardcoded defaults when a row or field is absent.

2. New Table: page_contents
   - id           uuid PK
   - page_key     text  UNIQUE NOT NULL  — stable slug identifying the page (e.g. 'home', 'about', 'shop')
   - page_label   text  NOT NULL          — human-friendly name shown in the admin dropdown
   - content      jsonb NOT NULL DEFAULT '{}'::jsonb — flexible key/value store for all editable fields
   - sections     jsonb NOT NULL DEFAULT '{}'::jsonb — map of section_key -> boolean visibility flag
   - updated_at   timestamptz DEFAULT now()
   - updated_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL

   The `content` jsonb holds arbitrary string fields (headings, subheadings, 
   promo text, image URLs, contact details, etc.) keyed by a field name.
   The `sections` jsonb holds visibility toggles keyed by section identifier.

3. Security
   - RLS enabled.
   - GRANT SELECT to anon, authenticated  → everyone can read public page content.
   - GRANT INSERT, UPDATE, DELETE to authenticated → only logged-in users can write,
     but RLS policies below restrict writes to admins only via is_admin().
   - SELECT policy: TO anon, authenticated USING (true) — content is intentionally public.
   - INSERT/UPDATE/DELETE policies: TO authenticated USING/WITH CHECK (is_admin()) — 
     only admin users can modify page content.

4. Seed Data
   Seeds default content for all major customer-facing pages:
   - home, about, login, register, cart, checkout, offers, categories,
     search, wishlist, orders, profile, support, notifications, 
     track, packages, shop, budget

5. Important Notes
   - is_admin() is an existing SECURITY DEFINER function that checks
     raw_app_meta_data->>'role' = 'admin' or users.role = 'admin'.
   - The content jsonb structure is intentionally flexible so each page
     can store different fields without schema changes.
*/

CREATE TABLE IF NOT EXISTS page_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text UNIQUE NOT NULL,
  page_label text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE page_contents ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON page_contents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON page_contents TO authenticated;

-- Everyone can read public page content
DROP POLICY IF EXISTS "page_contents_select_public" ON page_contents;
CREATE POLICY "page_contents_select_public"
  ON page_contents FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can insert
DROP POLICY IF EXISTS "page_contents_insert_admin" ON page_contents;
CREATE POLICY "page_contents_insert_admin"
  ON page_contents FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Only admins can update
DROP POLICY IF EXISTS "page_contents_update_admin" ON page_contents;
CREATE POLICY "page_contents_update_admin"
  ON page_contents FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admins can delete
DROP POLICY IF EXISTS "page_contents_delete_admin" ON page_contents;
CREATE POLICY "page_contents_delete_admin"
  ON page_contents FOR DELETE
  TO authenticated
  USING (is_admin());

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_page_contents_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS page_contents_updated_at ON page_contents;
CREATE TRIGGER page_contents_updated_at
  BEFORE UPDATE ON page_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_page_contents_timestamp();

REVOKE EXECUTE ON FUNCTION update_page_contents_timestamp FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION update_page_contents_timestamp TO authenticated;

-- Seed default content for all customer-facing pages
INSERT INTO page_contents (page_key, page_label, content, sections) VALUES
  ('home', 'Homepage', jsonb_build_object(
    'hero_title', 'Fresh Groceries, Delivered Fast',
    'hero_subtitle', 'Your one-stop shop for quality groceries in Nigeria',
    'hero_search_placeholder', 'Search for groceries, brands, products...',
    'promo_banner_title', 'Weekend Special: 20% Off Fresh Produce',
    'promo_banner_subtitle', 'Stock up on fruits and vegetables this weekend',
    'promo_banner_cta', 'Shop Now',
    'shop_by_budget_title', 'Shop by Budget',
    'shop_by_budget_subtitle', 'Quality groceries for every budget',
    'categories_title', 'Shop by Category',
    'categories_subtitle', 'Everything you need, organized for you',
    'meal_kit_title', 'Meal Kits',
    'meal_kit_subtitle', 'Pre-portioned ingredients for your favorite Nigerian recipes',
    'meal_kit_cta', 'Explore Meal Kits',
    'deals_title', 'Today''s Best Deals',
    'deals_subtitle', 'Save big on everyday essentials',
    'reviews_title', 'What Our Customers Say',
    'reviews_subtitle', 'Real reviews from happy shoppers across Nigeria',
    'packages_title', 'Curated Grocery Packages',
    'packages_subtitle', 'Save more with our pre-built bundles',
    'footer_text', 'Ukart — Fresh groceries delivered across Nigeria',
    'footer_contact', 'support@ukart.ng',
    'footer_phone', '+234 800 UKART',
    'footer_address', 'Lagos, Nigeria'
  ), jsonb_build_object(
    'hero', true,
    'promo_banner', true,
    'shop_by_budget', true,
    'categories', true,
    'meal_kits', true,
    'deals', true,
    'packages', true,
    'reviews', true,
    'footer', true
  )),
  ('about', 'About Us', jsonb_build_object(
    'title', 'About Ukart',
    'subtitle', 'Bringing fresh groceries to your doorstep across Nigeria',
    'description', 'Ukart is Nigeria''s premier grocery delivery platform, connecting you with fresh produce, pantry staples, and household essentials. We partner with local markets and suppliers to bring you quality products at affordable prices, delivered fast and fresh to your door.',
    'mission_title', 'Our Mission',
    'mission_text', 'To make quality groceries accessible to every Nigerian household through technology, fair pricing, and reliable delivery.',
    'vision_title', 'Our Vision',
    'vision_text', 'To be Africa''s most trusted grocery delivery platform, empowering communities with fresh, affordable food.',
    'contact_email', 'support@ukart.ng',
    'contact_phone', '+234 800 UKART',
    'contact_address', 'Lagos, Nigeria'
  ), jsonb_build_object(
    'hero', true,
    'mission', true,
    'vision', true,
    'contact', true
  )),
  ('login', 'Login Page', jsonb_build_object(
    'title', 'Welcome Back',
    'subtitle', 'Sign in to your Ukart account',
    'email_label', 'Email Address',
    'password_label', 'Password',
    'submit_button', 'Sign In',
    'google_button', 'Continue with Google',
    'apple_button', 'Continue with Apple',
    'guest_link', 'Continue as Guest',
    'register_link', 'Don''t have an account? Sign up',
    'forgot_link', 'Forgot password?'
  ), jsonb_build_object(
    'form', true,
    'social_login', true,
    'guest_option', true
  )),
  ('register', 'Register Page', jsonb_build_object(
    'title', 'Create Your Account',
    'subtitle', 'Join Ukart for fresh groceries delivered to your door',
    'name_label', 'Full Name',
    'email_label', 'Email Address',
    'password_label', 'Password',
    'phone_label', 'Phone Number',
    'submit_button', 'Create Account',
    'google_button', 'Sign up with Google',
    'apple_button', 'Sign up with Apple',
    'login_link', 'Already have an account? Sign in'
  ), jsonb_build_object(
    'form', true,
    'social_login', true
  )),
  ('cart', 'Shopping Cart', jsonb_build_object(
    'title', 'Your Cart',
    'empty_message', 'Your cart is empty',
    'empty_cta', 'Start Shopping',
    'subtotal_label', 'Subtotal',
    'delivery_label', 'Delivery Fee',
    'total_label', 'Total',
    'checkout_button', 'Proceed to Checkout',
    'continue_shopping_link', 'Continue Shopping'
  ), jsonb_build_object(
    'items', true,
    'summary', true
  )),
  ('checkout', 'Checkout', jsonb_build_object(
    'title', 'Checkout',
    'delivery_address_label', 'Delivery Address',
    'delivery_instructions_label', 'Delivery Instructions (Optional)',
    'payment_method_label', 'Payment Method',
    'place_order_button', 'Place Order',
    'back_link', 'Back to Cart'
  ), jsonb_build_object(
    'address', true,
    'payment', true,
    'summary', true
  )),
  ('offers', 'Offers & Deals', jsonb_build_object(
    'title', 'Special Offers',
    'subtitle', 'Save big on your favorite groceries',
    'empty_message', 'No active offers at the moment. Check back soon!'
  ), jsonb_build_object(
    'hero', true,
    'offers_list', true
  )),
  ('categories', 'All Categories', jsonb_build_object(
    'title', 'Shop by Category',
    'subtitle', 'Browse all our grocery categories'
  ), jsonb_build_object(
    'header', true,
    'grid', true
  )),
  ('search', 'Search', jsonb_build_object(
    'title', 'Search Products',
    'placeholder', 'Search for groceries, brands, products...',
    'empty_message', 'Start typing to search for products',
    'no_results_message', 'No products found. Try a different search term.'
  ), jsonb_build_object(
    'search_bar', true,
    'results', true
  )),
  ('wishlist', 'Wishlist', jsonb_build_object(
    'title', 'Your Wishlist',
    'empty_message', 'Your wishlist is empty',
    'empty_cta', 'Browse Products'
  ), jsonb_build_object(
    'items', true
  )),
  ('orders', 'Order History', jsonb_build_object(
    'title', 'Your Orders',
    'empty_message', 'You haven''t placed any orders yet',
    'empty_cta', 'Start Shopping'
  ), jsonb_build_object(
    'list', true
  )),
  ('profile', 'Profile', jsonb_build_object(
    'title', 'Your Profile',
    'name_label', 'Full Name',
    'email_label', 'Email',
    'phone_label', 'Phone Number',
    'address_label', 'Delivery Address',
    'save_button', 'Save Changes',
    'orders_link', 'My Orders',
    'wishlist_link', 'My Wishlist',
    'settings_link', 'Settings',
    'support_link', 'Help & Support',
    'logout_button', 'Log Out'
  ), jsonb_build_object(
    'details', true,
    'menu', true
  )),
  ('support', 'Help & Support', jsonb_build_object(
    'title', 'Help & Support',
    'subtitle', 'We''re here to help you with any questions or issues',
    'faq_title', 'Frequently Asked Questions',
    'contact_title', 'Contact Us',
    'contact_email', 'support@ukart.ng',
    'contact_phone', '+234 800 UKART',
    'new_ticket_button', 'Submit a Ticket',
    'tickets_link', 'View My Tickets'
  ), jsonb_build_object(
    'faq', true,
    'contact', true,
    'tickets', true
  )),
  ('notifications', 'Notifications', jsonb_build_object(
    'title', 'Notifications',
    'empty_message', 'No notifications yet'
  ), jsonb_build_object(
    'list', true
  )),
  ('track', 'Track Order', jsonb_build_object(
    'title', 'Track Your Order',
    'subtitle', 'Enter your order ID to see live delivery status',
    'placeholder', 'Enter Order ID',
    'submit_button', 'Track Order'
  ), jsonb_build_object(
    'form', true,
    'status', true
  )),
  ('packages', 'Packages', jsonb_build_object(
    'title', 'Grocery Packages',
    'subtitle', 'Save more with our curated bundles — everything you need in one box'
  ), jsonb_build_object(
    'header', true,
    'grid', true
  )),
  ('shop', 'Shop', jsonb_build_object(
    'title', 'Shop',
    'subtitle', 'Browse our full range of quality groceries',
    'filter_label', 'Filter',
    'sort_label', 'Sort',
    'add_to_cart', 'Add to Cart',
    'out_of_stock', 'Out of Stock'
  ), jsonb_build_object(
    'header', true,
    'filters', true,
    'products', true
  )),
  ('budget', 'Budget Shop', jsonb_build_object(
    'title', 'Shop by Budget',
    'subtitle', 'Quality groceries that fit your budget'
  ), jsonb_build_object(
    'header', true,
    'products', true
  )),
  ('payment-methods', 'Payment Methods', jsonb_build_object(
    'title', 'Payment Methods',
    'subtitle', 'Manage your saved payment methods',
    'add_button', 'Add Payment Method'
  ), jsonb_build_object(
    'list', true
  )),
  ('settings', 'Settings', jsonb_build_object(
    'title', 'Settings',
    'notifications_label', 'Notification Preferences',
    'privacy_label', 'Privacy',
    'about_label', 'About Ukart',
    'logout_button', 'Log Out'
  ), jsonb_build_object(
    'notifications', true,
    'privacy', true,
    'about', true
  ))
ON CONFLICT (page_key) DO NOTHING;

-- Index for fast lookups by page_key
CREATE INDEX IF NOT EXISTS idx_page_contents_page_key ON page_contents (page_key);
