# Project memory

## Product intent & audience

- **Ukart**: production e-commerce application (Vite + React frontend, Supabase backend).
- Audience: online shoppers (customer checkout, order history, delivery tracking, reorder) and store administrators (admin dashboard, order management, notifications).
- Payments processed via **Paystack** (NGN; test mode available with card `4084 0848 4084 0841`).

## Brand personality & voice

- Not yet inferred from explicit brand/design guidance; application is utility-focused e-commerce.

## Visual design & UX direction

- Checkout creates a pending order, then redirects to Paystack hosted checkout (no client-side popup/Inline).
- Post-payment return routes: `/payment/callback` → `PaymentSuccess`.
- Cart must persist until server-side verification confirms payment; cancelled/failed payments preserve cart.
- Order statuses include at least: "Awaiting Payment", "Paid", "Abandoned".
- Admin and customer dashboards share the same orders data; historical orders preserved.

## Decisions, constraints & rationale

- **Single payment architecture**: `process-paystack-payment` Edge Function is the only checkout init + verify entry point. `paystack-webhook` is the independent server-to-server reconciliation path. Both call the same idempotent RPC `finalize_paystack_payment` so duplicate webhook + callback never create competing orders.
- **Root cause fixed**: old flow used Paystack Inline + direct `mark_order_paid` RPC and never created a `payment_attempts` row → webhook logged "no matching payment attempt". New flow creates `payment_attempts` before checkout and links it to the pending `order_id`.
- `finalize_paystack_payment` rewritten: links/updates existing pending order instead of duplicating; returns `alreadyProcessed: true` for repeat calls; no longer rejects `failed`/`abandoned` attempts when Paystack verifies success; idempotent `payments` insert; index on `payment_attempts(order_id)`.
- Edge functions invoke server-side Paystack secret keys only (never frontend). `verify_jwt: true` for `process-paystack-payment`, `false` for `paystack-webhook` (receives signed Paystack POST).
- Frontend uses `base44.functions.invoke` / `invokeEdgeFunction` which returns JSON directly (not `{ data }`).
- `orders` table has no `user_id` column; `public.users` has `id` (uuid) but no email — `payment_attempts.user_id` passed null since finalize uses linked `order_id` path.
- Security preserved: Supabase RLS/auth intact, service role used only in edge functions, no existing orders/payment records deleted, no duplicate tables/functions created.
- `mark_order_paid` RPC retained but unused (harmless; removable later).

## Open questions & assumptions

- Paystack test-mode lifecycle not yet validated in-browser by developer; full manual test pending (success, duplicate webhook, failed, cancelled, dashboard visibility).
- Production deploy of DB/edge changes requires explicit user approval; edge functions are now deployed and ACTIVE, migration applied.
- No live credential switch or site publish performed.
- `notifyOrderCreated` moved server-side into edge function; confirm notification delivery meets existing expectations.
- Brand/visual design direction not yet captured — update if user provides design guidance.