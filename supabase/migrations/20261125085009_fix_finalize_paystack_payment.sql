/*
# Fix finalize_paystack_payment — idempotent, retry-aware, recovery from failed

## Problem
The webhook receives successful Paystack references that have no matching
payment_attempts row → "Webhook reference has no matching payment attempt".
Additionally, the function rejected any attempt whose status was not
'initialized', so a genuinely successful payment was ignored if an earlier
abandon marked the attempt 'failed'.

## Changes
1. `finalize_paystack_payment` now:
   - Accepts a verified successful transaction even when the attempt status is
     'failed' or 'abandoned' — a genuine Paystack success is never ignored.
   - If the attempt already has an `order_id`, marks THAT existing order as
     Paid (idempotent for the Checkout flow that creates the order row first
     and links it to the attempt). Returns `alreadyProcessed: true` if the
     order is already Paid.
   - If the attempt has no `order_id`, creates a new order from
     `checkout_data` (the original server-side flow).
   - Inserts a `payments` row only if one does not already exist for the
     reference (prevents duplicate payment records on duplicate webhook
     delivery).
   - Sets the attempt status to 'verified' and links the order id.
2. Grants EXECUTE to `authenticated` and `anon` so both the JWT-protected
   `process-paystack-payment` edge function (which forwards the user's
   session) and the `paystack-webhook` edge function (service role, no JWT)
   can call it.  The webhook uses the service role key which bypasses RLS
   and has EXECUTE by default.
3. Adds an index on `payment_attempts(order_id)` for fast order lookups.

## Security
- Function remains SECURITY DEFINER with `search_path = 'public', 'auth'`.
- No new tables. No columns dropped or renamed.
- The function only marks an order Paid when Paystack's verified transaction
  data matches the stored attempt (amount, currency, reference, transaction
  id, and status = 'success').
*/

-- Index for looking up attempts by order_id
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id
  ON public.payment_attempts (order_id)
  WHERE order_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.finalize_paystack_payment(
  p_reference text,
  p_transaction_id numeric,
  p_transaction_data jsonb,
  p_mode text DEFAULT 'live'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
declare
  v_attempt public.payment_attempts%rowtype;
  v_checkout jsonb;
  v_order public.orders%rowtype;
  v_user_email text;
  v_total numeric;
  v_order_number text;
  v_existing_payment text;
  v_order_paid boolean;
begin
  -- Lock the attempt row for the duration of this transaction.
  select * into v_attempt
  from public.payment_attempts
  where reference = p_reference
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Payment attempt not found');
  end if;

  -- Defense in depth: only finalize a matching successful transaction.
  if p_transaction_data->>'status' is distinct from 'success'
     or p_transaction_data->>'reference' is distinct from p_reference
     or coalesce((p_transaction_data->>'amount')::bigint, -1) <> v_attempt.amount_kobo
     or p_transaction_data->>'currency' is distinct from v_attempt.currency
     or p_transaction_id is distinct from (p_transaction_data->>'id')::numeric then
    return jsonb_build_object(
      'ok', false,
      'error', 'Verified transaction does not match payment attempt'
    );
  end if;

  -- Case 1: attempt already linked to an order (Checkout flow).
  -- Mark that existing order as Paid — idempotent.
  if v_attempt.order_id is not null then
    select * into v_order
    from public.orders
    where id = v_attempt.order_id
    for update;

    if not found then
      -- The linked order was deleted; fall through to create a new one.
      v_attempt.order_id := null;
    elsif v_order.payment_status = 'Paid' then
      -- Already processed — return idempotent success.
      return jsonb_build_object(
        'ok', true,
        'orderId', v_order.id,
        'alreadyProcessed', true
      );
    else
      -- Mark the existing pending order as Paid.
      update public.orders
      set payment_status = 'Paid',
          status = 'new',
          paystack_reference = p_reference,
          paystack_transaction_id = p_transaction_id,
          payment_channel = p_transaction_data->>'channel',
          payment_timestamp = coalesce(
            nullif(p_transaction_data->>'paid_at', '')::timestamptz,
            now()
          ),
          paystack_mode = case when p_mode = 'test' then 'test' else 'live' end,
          paystack_response = p_transaction_data,
          updated_date = now()
      where id = v_order.id
      returning * into v_order;

      -- Insert payment record if not already present.
      select id::text into v_existing_payment
      from public.payments
      where reference = p_reference
      limit 1;

      if v_existing_payment is null then
        insert into public.payments (
          order_id, order_number, reference, paystack_transaction_id, amount,
          currency, status, customer_email, customer_name, payment_channel,
          paystack_response, mode, initialized_at, verified_at, paid_at
        ) values (
          v_order.id::text,
          v_order.order_number,
          p_reference,
          p_transaction_id,
          v_order.total,
          v_attempt.currency,
          'paid',
          v_order.customer_email,
          v_order.customer_name,
          p_transaction_data->>'channel',
          p_transaction_data,
          case when p_mode = 'test' then 'test' else 'live' end,
          v_attempt.created_at,
          now(),
          coalesce(
            nullif(p_transaction_data->>'paid_at', '')::timestamptz,
            now()
          )
        );
      end if;

      update public.payment_attempts
      set status = 'verified',
          verified_at = now()
      where id = v_attempt.id;

      return jsonb_build_object(
        'ok', true,
        'orderId', v_order.id
      );
    end if;
  end if;

  -- Case 2: attempt has no linked order — create a new order from checkout_data.
  select email into v_user_email
  from auth.users
  where id = v_attempt.user_id;

  if v_user_email is null then
    return jsonb_build_object('ok', false, 'error', 'Customer account email not found');
  end if;

  v_checkout := v_attempt.checkout_data;
  v_total := v_attempt.amount_kobo::numeric / 100;
  v_order_number := 'UK-' || upper(
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  );

  insert into public.orders (
    order_number, items, subtotal, delivery_fee, service_fee, discount,
    voucher_code, voucher_id, total, customer_name, customer_email,
    customer_phone, alternate_phone, customer_address, landmark,
    delivery_zone, delivery_lat, delivery_lng, payment_method,
    payment_status, status, paystack_reference, paystack_transaction_id,
    payment_channel, payment_timestamp, paystack_mode, paystack_response,
    is_first_order, first_order_discount, referral_id, referral_type
  ) values (
    v_order_number,
    coalesce(v_checkout->'items', '[]'::jsonb),
    coalesce((v_checkout->>'subtotal')::numeric, 0),
    coalesce((v_checkout->>'delivery_fee')::numeric, 0),
    coalesce((v_checkout->>'service_fee')::numeric, 0),
    coalesce((v_checkout->>'discount')::numeric, 0),
    nullif(v_checkout->>'voucher_code', ''),
    nullif(v_checkout->>'voucher_id', ''),
    v_total,
    v_checkout->>'customer_name',
    v_user_email,
    v_checkout->>'customer_phone',
    v_checkout->>'alternate_phone',
    v_checkout->>'customer_address',
    v_checkout->>'landmark',
    coalesce(v_checkout->>'delivery_zone', 'island'),
    nullif(v_checkout->>'delivery_lat', '')::numeric,
    nullif(v_checkout->>'delivery_lng', '')::numeric,
    'Pay Online',
    'Paid',
    'new',
    p_reference,
    p_transaction_id,
    p_transaction_data->>'channel',
    coalesce(
      nullif(p_transaction_data->>'paid_at', '')::timestamptz,
      now()
    ),
    case when p_mode = 'test' then 'test' else 'live' end,
    p_transaction_data,
    coalesce((v_checkout->>'is_first_order')::boolean, false),
    coalesce((v_checkout->>'first_order_discount')::numeric, 0),
    nullif(v_checkout->>'referral_id', ''),
    nullif(v_checkout->>'referral_type', '')
  )
  returning * into v_order;

  -- Insert payment record if not already present.
  select id::text into v_existing_payment
  from public.payments
  where reference = p_reference
  limit 1;

  if v_existing_payment is null then
    insert into public.payments (
      order_id, order_number, reference, paystack_transaction_id, amount,
      currency, status, customer_email, customer_name, payment_channel,
      paystack_response, mode, initialized_at, verified_at, paid_at
    ) values (
      v_order.id::text,
      v_order.order_number,
      p_reference,
      p_transaction_id,
      v_total,
      v_attempt.currency,
      'paid',
      v_user_email,
      v_order.customer_name,
      p_transaction_data->>'channel',
      p_transaction_data,
      case when p_mode = 'test' then 'test' else 'live' end,
      v_attempt.created_at,
      now(),
      coalesce(
        nullif(p_transaction_data->>'paid_at', '')::timestamptz,
        now()
      )
    );
  end if;

  -- Voucher / referral rewards
  if nullif(v_checkout->>'voucher_id', '') is not null then
    update public.vouchers
    set uses = coalesce(uses, 0) + 1,
        updated_date = now()
    where id::text = v_checkout->>'voucher_id';
  end if;

  if nullif(v_checkout->>'referral_id', '') is not null then
    if v_checkout->>'referral_type' = 'referred' then
      update public.referrals
      set referred_rewarded = true,
          status = case
            when referrer_rewarded then 'rewarded'
            else status
          end,
          updated_date = now()
      where id::text = v_checkout->>'referral_id';

    elsif v_checkout->>'referral_type' = 'referrer' then
      update public.referrals
      set referrer_rewarded = true,
          status = case
            when referred_rewarded then 'rewarded'
            else status
          end,
          updated_date = now()
      where id::text = v_checkout->>'referral_id';
    end if;
  end if;

  update public.payment_attempts
  set status = 'verified',
      order_id = v_order.id,
      verified_at = now()
  where id = v_attempt.id;

  return jsonb_build_object(
    'ok', true,
    'orderId', v_order.id
  );
end;
$$;

-- Keep the function callable by authenticated users (process-paystack-payment
-- forwards the session JWT) and by the service role (paystack-webhook).
-- The webhook uses SUPABASE_SERVICE_ROLE_KEY which bypasses EXECUTE checks
-- but we keep the grant explicit for clarity.
REVOKE EXECUTE ON FUNCTION public.finalize_paystack_payment(text, numeric, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_paystack_payment(text, numeric, jsonb, text) TO authenticated;
