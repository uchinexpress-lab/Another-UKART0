/*
  # Remove anonymous access to staff management

  1. Security
    - public.manage_staff creates and re-roles staff accounts (and returns a
      temporary password for invites). EXECUTE is revoked from PUBLIC and anon so
      only signed-in callers reach it; its internal super-admin check (now
      trustworthy because role columns are no longer user-writable) still applies.
*/

REVOKE EXECUTE ON FUNCTION public.manage_staff(text, uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.manage_staff(text, uuid, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.manage_staff(text, uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_staff(text, uuid, text, text, text) TO service_role;
