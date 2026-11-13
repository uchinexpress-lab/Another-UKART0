/*
# Create login_with_setup_code function

This function is called when the first super admin enters the 6-digit
setup code. It:
1. Verifies the code matches the hardcoded value.
2. Checks no super_admin already exists (one-shot gate).
3. Creates a proper auth user with a generated password using GoTrue-compatible
   hash (via extensions.crypt with bf).
4. Promotes the user to super_admin.
5. Returns the email + temp password so the client can sign in with
   supabase.auth.signInWithPassword to get a real session.

This avoids the edge function entirely — everything runs as a database
function callable via RPC.
*/

CREATE OR REPLACE FUNCTION public.login_with_setup_code(
  p_code text,
  p_email text DEFAULT 'admin@ukart.com',
  p_full_name text DEFAULT 'Super Admin'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_existing uuid;
  v_user_id uuid;
  v_password text;
  v_encrypted text;
BEGIN
  -- Validate the setup code
  IF p_code IS NULL OR p_code <> '184518' THEN
    RETURN jsonb_build_object('error', 'Invalid setup code');
  END IF;

  -- Gate: only works if no super admin exists yet
  SELECT id INTO v_existing
  FROM public.users
  WHERE role = 'admin' AND staff_role = 'super_admin'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'A super admin already exists. Use the staff login instead.');
  END IF;

  -- Check if the email is already taken by a non-admin user
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  -- Generate a strong random password
  v_password := 'Uk@' || upper(substr(extensions.gen_salt('bf'), 1, 6)) || substr(md5(random()::text), 1, 6) || '!1';

  IF v_user_id IS NOT NULL THEN
    -- Update existing user's password and promote
    v_encrypted := extensions.crypt(v_password, extensions.gen_salt('bf'));
    UPDATE auth.users
    SET encrypted_password = v_encrypted,
        email_confirmed_at = now()
    WHERE id = v_user_id;

    UPDATE public.users
    SET role = 'admin', staff_role = 'super_admin', admin_approval_status = 'approved',
        full_name = p_full_name, updated_date = now()
    WHERE id = v_user_id;
  ELSE
    -- Create new auth user
    v_encrypted := extensions.crypt(v_password, extensions.gen_salt('bf'));
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, email_change_confirm_status,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', p_email, v_encrypted,
      now(), 0, '{}'::jsonb,
      jsonb_build_object('full_name', p_full_name),
      now(), now(), '', ''
    );

    INSERT INTO public.users (id, role, staff_role, admin_approval_status, full_name)
    VALUES (v_user_id, 'admin', 'super_admin', 'approved', p_full_name)
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', staff_role = 'super_admin', admin_approval_status = 'approved',
        full_name = p_full_name, updated_date = now();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'email', p_email,
    'password', v_password,
    'message', 'Super admin account created'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.login_with_setup_code(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_with_setup_code(text, text, text) TO anon, authenticated;
