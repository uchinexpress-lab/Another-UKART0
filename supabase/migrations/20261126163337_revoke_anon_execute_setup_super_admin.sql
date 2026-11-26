/*
  # Remove anonymous access to the super admin bootstrap

  1. Security
    - public.setup_super_admin creates an auth account wired to super_admin and was
      callable by anon. It is now only callable by service_role; the supported
      bootstrap path is the service-role inviteStaff edge function ("setup" action),
      which performs the same "no super admin yet" check.
*/

REVOKE EXECUTE ON FUNCTION public.setup_super_admin(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.setup_super_admin(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.setup_super_admin(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.setup_super_admin(text, text, text) TO service_role;
