/*
# Fix duplicate promote_to_super_admin signatures

The original function had 2 params, the updated one has 3.
PostgreSQL sees both and can't resolve which to call.
Drop and recreate with a single canonical signature.
*/

DROP FUNCTION IF EXISTS public.promote_to_super_admin(text, text);
DROP FUNCTION IF EXISTS public.promote_to_super_admin(text, text, text);

CREATE OR REPLACE FUNCTION public.promote_to_super_admin(
  p_email text,
  p_full_name text DEFAULT 'Super Admin',
  p_admin_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_existing uuid;
  v_user_id uuid;
BEGIN
  SELECT id INTO v_existing
  FROM public.users
  WHERE role = 'admin' AND staff_role = 'super_admin'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'A super admin already exists. Use the staff login instead.');
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No account found with that email. Please sign up first.');
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = v_user_id;

  INSERT INTO public.users (id, role, staff_role, admin_approval_status, full_name)
  VALUES (v_user_id, 'admin', 'super_admin', 'approved', COALESCE(p_admin_name, p_full_name, 'Super Admin'))
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      staff_role = 'super_admin',
      admin_approval_status = 'approved',
      full_name = COALESCE(p_admin_name, p_full_name, 'Super Admin'),
      updated_date = now();

  RETURN jsonb_build_object('success', true, 'email', p_email, 'message', 'Super admin account created');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.promote_to_super_admin(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_to_super_admin(text, text, text) TO anon, authenticated;
