/*
# Harden helper functions and delivery OTP access

1. Security changes
- `handle_new_user()` is a trigger function. It must never be callable through the
  Data API. Revoke EXECUTE from PUBLIC, anon, and authenticated.
- `is_admin()` is only used in policies scoped `TO authenticated`. Revoke EXECUTE
  from PUBLIC and anon so anonymous visitors cannot probe it; keep it executable
  by `authenticated` (needed for admin write policies to evaluate).
- `delivery_otps` intentionally has no client policies (service-role only). Grant
  nothing further; this migration only documents that state for the linter by
  leaving it as-is (RLS on, no policies = fully locked for clients).

2. Notes
- No data changes. Safe to re-run.
*/

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
