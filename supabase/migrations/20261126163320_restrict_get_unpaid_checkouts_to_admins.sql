/*
  # Restrict the unpaid checkout list to admins

  1. Changes
    - public.get_unpaid_checkouts() returned every unverified checkout (customer
      name, phone, address and cart) to ANY signed-in caller, with no admin check.
    - The function is recreated as PL/pgSQL with an explicit public.is_admin()
      guard; non-admin callers now get a permission error instead of data.

  2. Security
    - EXECUTE revoked from PUBLIC and anon; granted to authenticated (the staff
      screen) where the in-function admin check applies, and to service_role.
*/

CREATE OR REPLACE FUNCTION public.get_unpaid_checkouts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', pa.id,
        'reference', pa.reference,
        'user_id', pa.user_id,
        'amount_kobo', pa.amount_kobo,
        'currency', pa.currency,
        'checkout_data', pa.checkout_data,
        'status', pa.status,
        'order_id', pa.order_id,
        'created_at', pa.created_at,
        'verified_at', pa.verified_at
      )
      order by pa.created_at desc
    ),
    '[]'::jsonb
  )
  into v_result
  from public.payment_attempts pa
  where pa.status is distinct from 'verified';

  return v_result;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_unpaid_checkouts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_unpaid_checkouts() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_unpaid_checkouts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unpaid_checkouts() TO service_role;
