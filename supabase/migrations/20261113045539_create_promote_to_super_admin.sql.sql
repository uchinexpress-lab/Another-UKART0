/*
# Create promote_to_super_admin function

Replaces the old setup_super_admin function which manually inserted
into auth.users — that produced a password hash GoTrue could not verify,
so login always failed.

The new flow:
1. Frontend calls supabase.auth.signUp() — GoTrue creates the user with
   a properly hashed password.
2. Frontend then calls this RPC to promote the new user to super_admin.

This function is SECURITY DEFINER so it can write to public.users with
elevated privileges. It only works if no super_admin exists yet (one-shot gate).
*/

CREATE OR REPLACE FUNCTION public.promote_to_super_admin(
  p_email text,
  p_full_name text DEFAULT 'Super Admin'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_existing uuid;
  v_user_id uuid;
BEGIN
  -- Gate: only works if no super admin exists yet
  SELECT id INTO v_existing
  FROM public.users
  WHERE role = 'admin' AND staff_role = 'super_admin'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'A super admin already exists. Use the staff login instead.');
  END IF;

  -- Find the auth user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No account found with that email. Please sign up first.');
  END IF;

  -- Confirm their email so they don't need to verify it
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = v_user_id;

  -- Promote their profile
  INSERT INTO public.users (id, role, staff_role, admin_approval_status, full_name)
  VALUES (v_user_id, 'admin', 'super_admin', 'approved', p_full_name)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      staff_role = 'super_admin',
      admin_approval_status = 'approved',
      full_name = p_full_name,
      updated_date = now();

  RETURN jsonb_build_object('success', true, 'email', p_email, 'message', 'Super admin account created');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.promote_to_super_admin(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_to_super_admin(text, text) TO anon, authenticated;
