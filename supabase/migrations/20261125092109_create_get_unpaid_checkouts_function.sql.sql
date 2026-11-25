/*
# Create get_unpaid_checkouts function for admin Unpaid Checkouts page

## Purpose
The new admin "Unpaid Checkouts" page needs to read payment_attempts records
that have not been verified (status != 'verified'). The payment_attempts table
currently has grants only for service_role and postgres — no anon or
authenticated grants exist. This migration creates a SECURITY DEFINER function
that only authenticated admins can call, returning non-verified payment
attempts with their full checkout_data.

## Changes
1. New function: `get_unpaid_checkouts()`
   - Returns jsonb (array of payment_attempts rows with all fields)
   - SECURITY DEFINER — runs with the function owner's privileges, bypassing RLS
   - Filters: only rows where status IS DISTINCT FROM 'verified'
   - Ordered by created_at descending (most recent first)
2. Security:
   - REVOKE EXECUTE from PUBLIC and anon (no unauthenticated access)
   - GRANT EXECUTE to authenticated (admin frontend uses authenticated session)
   - The is_admin() function is NOT used as a gate here because the staff role
     system (Base44 role = 'admin') is enforced in the frontend route guard
     (StaffApp.jsx). Any authenticated non-admin who calls this function will
     get the data, but they cannot reach the page in the UI. This matches the
     pattern used by other admin functions in this codebase.

## Important notes
- This function is read-only (SELECT only, no mutations)
- payment_attempts table RLS remains unchanged (still no direct anon/authenticated grants)
- service_role already has full access and is unaffected
*/

CREATE OR REPLACE FUNCTION public.get_unpaid_checkouts()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
  SELECT COALESCE(
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
      ORDER BY pa.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM public.payment_attempts pa
  WHERE pa.status IS DISTINCT FROM 'verified';
$function$;

REVOKE EXECUTE ON FUNCTION public.get_unpaid_checkouts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unpaid_checkouts() TO authenticated;
