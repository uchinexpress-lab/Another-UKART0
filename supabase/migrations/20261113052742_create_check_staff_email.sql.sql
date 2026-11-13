/*
# Create check_staff_email function

Returns whether an email belongs to an approved admin staff member.
Used by the staff login page before sending a magic link, so non-staff
emails don't get a login link.
*/

CREATE OR REPLACE FUNCTION public.check_staff_email(p_email text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT jsonb_build_object(
    'is_staff', COALESCE(
      (SELECT u.role = 'admin' AND u.admin_approval_status = 'approved'
       FROM public.users u
       JOIN auth.users a ON a.id = u.id
       WHERE a.email = p_email),
      false
    ),
    'is_super_admin', COALESCE(
      (SELECT u.role = 'admin' AND u.staff_role = 'super_admin'
       FROM public.users u
       JOIN auth.users a ON a.id = u.id
       WHERE a.email = p_email),
      false
    ),
    'has_account', EXISTS(SELECT 1 FROM auth.users WHERE email = p_email)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.check_staff_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_staff_email(text) TO anon, authenticated;
