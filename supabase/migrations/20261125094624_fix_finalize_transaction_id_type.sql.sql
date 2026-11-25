/*
# Fix finalize_paystack_payment transaction ID comparison

## Problem
The edge function and webhook both pass `p_transaction_id` as `Number(txn.id)`.
JavaScript's `Number` type (float64) loses precision for Paystack transaction IDs
which are 15+ digit integers. For example, a Paystack ID like `5938274650123456`
becomes `5938274650123456.0` which may round to a different value in float64.

The function then compares:
  p_transaction_id IS DISTINCT FROM (p_transaction_data->>'id')::numeric

Since `p_transaction_data` is the raw JSON from Paystack (preserving the exact
ID as a string), but `p_transaction_id` was converted through JS float64, the
two values can differ — causing "Verified transaction does not match payment
attempt" even for legitimate successful payments.

## Fix
Change the function parameter `p_transaction_id` from `numeric` to `text`.
The comparison then becomes:
  p_transaction_id IS DISTINCT FROM p_transaction_data->>'id'

This compares the ID as a string (exact match) without any numeric conversion.
The `orders.paystack_transaction_id` and `payments.paystack_transaction_id`
columns are `numeric`, so the INSERT still casts the string to numeric at the
column level — which is safe because the string is the exact Paystack value.

## Important notes
- The function signature changes from `(p_reference text, p_transaction_id numeric, ...)`
  to `(p_reference text, p_transaction_id text, ...)`. Both edge functions must
  be updated to pass the transaction ID as a string (txn.id is already a string
  or number in the JSON, and we'll pass it as-is without `Number()` conversion).
- No data is modified or lost — only the function definition changes.
- The function remains SECURITY DEFINER and idempotent.
*/

CREATE OR REPLACE FUNCTION public.finalize_paystack_payment(
  p_reference text,
  p_transaction_id text,
  p_transaction_data jsonb,
  p_mode text DEFAULT 'live'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
declare
  v_attempt public.payment_attempts%rowtype;
  v_checkout jsonb;
  v_order public.orders%rowtype;
  v_user_email text;
  v_total numeric;
  v_order_number text;
  v_existing_payment text;
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
  -- Compare transaction ID as text (exact match) to avoid float64 precision loss.
  if p_transaction_data->>'status' is distinct from 'success'
  or p_transaction_data->>'reference' is distinct from p_reference
  or coalesce((p_transaction_data->>'amount')::bigint, -1) <> v_attempt.amount_kobo
  or p_transaction_data->>'currency' is distinct from v_attempt.currency
  or p_transaction_id is distinct from p_transaction_data->>'id' then
    return jsonb_build_object(
      'ok', false,
      'error', 'Verified transaction does not match payment attempt'
    );
  end if;

  -- Case 1: attempt already linked to an order (legacy checkout flow).
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
          paystack_transaction_id = p_transaction_id::numeric,
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
          p_transaction_id::numeric,
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
    p_transaction_id::numeric,
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
      p_transaction_id::numeric,
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
$function$;
