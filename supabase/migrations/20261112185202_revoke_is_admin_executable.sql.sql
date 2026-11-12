/*
# Lock down is_admin RPC access

1. Security changes
- `is_admin()` is a SECURITY DEFINER helper used inside RLS policies. Signed-in
  users do not need to call it directly over the Data API — only the policy
  engine evaluates it. Revoke EXECUTE from `authenticated` as well, leaving it
  callable by the policy engine only (policies run as the table owner and are
  not affected by EXECUTE grants).

2. Notes
- `delivery_otps` keeps RLS enabled with no policies: it is intentionally
  service-role only (the linter INFO finding is expected).
- No data changes. Safe to re-run.
*/

revoke execute on function public.is_admin() from authenticated;
