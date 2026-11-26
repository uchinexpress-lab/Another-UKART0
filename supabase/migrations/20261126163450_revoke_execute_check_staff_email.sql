/*
  # Close the staff account enumeration oracle

  1. Security
    - public.check_staff_email returned has_account / is_staff / is_super_admin for
      any email address to any caller, including signed-out ones, which let anyone
      test whether an address has an account.
    - EXECUTE is revoked from PUBLIC, anon and authenticated; only service_role can
      call it. The staff login screen no longer uses it: staff membership is
      verified after sign-in by the admin area.
*/

REVOKE EXECUTE ON FUNCTION public.check_staff_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_staff_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_staff_email(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_staff_email(text) TO service_role;
