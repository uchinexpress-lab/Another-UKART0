/*
  # Stop anonymous reading of all orders

  1. Security
    - Drops policy "Allow users view own orders" on public.orders, which despite its
      name was SELECT TO anon, authenticated USING (true): every visitor could read
      every order, including customer names, phone numbers and addresses.
    - The correct policy orders_read_own_or_admin remains and continues to serve a
      customer their own orders and admins all orders.
*/

DROP POLICY IF EXISTS "Allow users view own orders" ON public.orders;
