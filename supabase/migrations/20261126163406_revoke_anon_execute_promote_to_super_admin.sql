/*
  # Remove anonymous access to super admin promotion

  1. Security
    - public.promote_to_super_admin could be called by signed-out visitors. EXECUTE
      is revoked from PUBLIC and anon; authenticated and service_role keep it so the
      one-time /admin/setup flow (which signs the account up first) still works, and
      the function keeps its internal "no super admin exists yet" gate.
*/

REVOKE EXECUTE ON FUNCTION public.promote_to_super_admin(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_to_super_admin(text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.promote_to_super_admin(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_super_admin(text, text, text) TO service_role;
