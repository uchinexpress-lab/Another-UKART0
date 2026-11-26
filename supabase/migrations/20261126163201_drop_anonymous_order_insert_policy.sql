/*
  # Stop anonymous creation of orders

  1. Security
    - Drops policy "Allow authenticated insert orders" on public.orders, which was
      INSERT TO anon, authenticated WITH CHECK (true) and therefore let signed-out
      callers create arbitrary orders (including ones marked as already paid).
    - orders_insert_own remains for the signed-in customer flow; paid orders are
      created server-side by finalize_paystack_payment.
*/

DROP POLICY IF EXISTS "Allow authenticated insert orders" ON public.orders;
