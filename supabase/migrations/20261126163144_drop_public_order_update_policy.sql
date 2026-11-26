/*
  # Stop anyone from modifying any order

  1. Security
    - Drops policy "Allow users update own orders" on public.orders, which was
      UPDATE TO anon, authenticated USING (true) with no WITH CHECK, allowing any
      caller (even signed out) to edit any order, including its payment_status.
    - orders_admin_update remains for staff edits.
*/

DROP POLICY IF EXISTS "Allow users update own orders" ON public.orders;
