/*
# Create mark_order_paid RPC

Allows an authenticated customer to mark their OWN order as paid after a
successful Paystack Inline transaction, since the orders UPDATE policy is
admin-only. The function verifies the caller owns the order before updating.

1. New Functions
- public.mark_order_paid(p_order_id uuid, p_reference text, p_transaction_id numeric)
  SECURITY DEFINER, verifies customer_email matches the caller's auth email.
  Sets payment_status='Paid', status='new', paystack_reference, paystack_transaction_id,
  payment_timestamp=now().
2. Security
  - REVOKE EXECUTE FROM PUBLIC, anon.
  - GRANT EXECUTE TO authenticated.
*/

CREATE OR REPLACE FUNCTION public.mark_order_paid(
  p_order_id uuid,
  p_reference text,
  p_transaction_id numeric DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_email text;
  v_owner_email text;
BEGIN
  SELECT a.email INTO v_email
  FROM auth.users a
  WHERE a.id = auth.uid();

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT o.customer_email INTO v_owner_email
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_owner_email IS NULL THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  IF v_owner_email <> v_email AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  UPDATE public.orders
  SET payment_status = 'Paid',
      status = 'new',
      paystack_reference = p_reference,
      paystack_transaction_id = p_transaction_id,
      payment_timestamp = now(),
      updated_date = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_order_paid(uuid, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_order_paid(uuid, text, numeric) TO authenticated;
