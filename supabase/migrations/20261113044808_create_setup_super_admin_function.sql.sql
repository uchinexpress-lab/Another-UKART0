/*
# Create setup_super_admin SECURITY DEFINER function

## Purpose
Replaces the unresponsive inviteStaff edge function for the one-time
super admin setup. The frontend calls this via Supabase RPC (`.rpc()`)
instead of an edge function, avoiding the edge function timeout issue.

## What it does
1. Checks if a super_admin already exists in public.users — aborts if so.
2. Inserts a new row into auth.users with a bcrypt-hashed password.
3. Inserts a corresponding profile row into public.users with
   role='admin', staff_role='super_admin', admin_approval_status='approved'.
4. Returns success or an error message.

## Security
- SECURITY DEFINER: runs with the function owner's privileges (postgres),
  so it can write to auth.users (which is normally restricted).
- REVOKE EXECUTE FROM PUBLIC, anon — only the anon key needs to call this
  for the one-time setup, so we grant to anon, authenticated.
- The function is safe because it can only create a super admin when
  zero super admins exist (one-shot gate).
*/

-- We need the pgcrypto extension for crypt() and gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.setup_super_admin(
  p_email text,
  p_password text,
  p_full_name text DEFAULT 'Super Admin'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_existing uuid;
  v_user_id uuid;
  v_encrypted text;
BEGIN
  -- Gate: only works if no super admin exists yet
  SELECT id INTO v_existing
  FROM public.users
  WHERE role = 'admin' AND staff_role = 'super_admin'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'A super admin already exists. Use the staff login instead.');
  END IF;

  IF p_email IS NULL OR p_password IS NULL THEN
    RETURN jsonb_build_object('error', 'Email and password are required');
  END IF;

  IF length(p_password) < 8 THEN
    RETURN jsonb_build_object('error', 'Password must be at least 8 characters');
  END IF;

  -- Check if auth user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- User exists, just promote them
    UPDATE public.users
    SET role = 'admin',
        staff_role = 'super_admin',
        admin_approval_status = 'approved',
        full_name = p_full_name,
        updated_date = now()
    WHERE id = v_user_id;

    -- Confirm their email
    UPDATE auth.users
    SET email_confirmed_at = now(),
        raw_user_meta_data = jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb),
          '{full_name}',
          to_jsonb(p_full_name)
        )
    WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true, 'email', p_email, 'message', 'Existing user promoted to super admin');
  END IF;

  -- Create new auth user
  v_encrypted := crypt(p_password, gen_salt('bf'));
  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    email_change_confirm_status,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted,
    now(),
    0,
    '{}'::jsonb,
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    '',
    ''
  );

  -- Insert the profile row (handle_new_user trigger may have already done this)
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

-- Only anon and authenticated can call this (for the one-time setup)
REVOKE EXECUTE ON FUNCTION public.setup_super_admin(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_super_admin(text, text, text) TO anon, authenticated;
