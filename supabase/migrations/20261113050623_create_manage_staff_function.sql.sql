/*
# Create manage_staff function and update promote_to_super_admin

## manage_staff
A SECURITY DEFINER function that handles all staff management actions
(promote, updateRole, approve, reject, deactivate) that were previously
done via the broken inviteStaff edge function. It verifies the caller
is a super_admin before performing any action.

## promote_to_super_admin update
Now also accepts an optional admin_name so the first super admin can
set their name when entering via the 6-digit code flow.
*/

-- ============================================================
-- manage_staff function
-- ============================================================
CREATE OR REPLACE FUNCTION public.manage_staff(
  p_action text,
  p_user_id uuid DEFAULT NULL,
  p_staff_role text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_full_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_caller record;
  v_target record;
  v_new_user_id uuid;
  v_temp_pass text;
BEGIN
  -- Verify caller is super_admin
  SELECT role, staff_role INTO v_caller
  FROM public.users WHERE id = auth.uid();

  IF v_caller.role IS NULL OR v_caller.role <> 'admin' OR v_caller.staff_role <> 'super_admin' THEN
    RETURN jsonb_build_object('error', 'Only super admins can manage staff');
  END IF;

  ------------------ promote ------------------
  IF p_action = 'promote' THEN
    IF p_user_id IS NULL THEN RETURN jsonb_build_object('error', 'userId is required'); END IF;
    UPDATE public.users
    SET role = 'admin', admin_approval_status = 'pending', updated_date = now()
    WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true);
  END IF;

  ------------------ updateRole ------------------
  IF p_action = 'updateRole' THEN
    IF p_user_id IS NULL OR p_staff_role IS NULL THEN
      RETURN jsonb_build_object('error', 'userId and staffRole are required');
    END IF;
    -- Don't allow demoting a super_admin
    SELECT staff_role INTO v_target FROM public.users WHERE id = p_user_id;
    IF v_target.staff_role = 'super_admin' AND p_staff_role <> 'super_admin' THEN
      RETURN jsonb_build_object('error', 'Cannot change a super admin role');
    END IF;
    UPDATE public.users
    SET staff_role = p_staff_role, updated_date = now()
    WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true);
  END IF;

  ------------------ approve ------------------
  IF p_action = 'approve' THEN
    IF p_user_id IS NULL THEN RETURN jsonb_build_object('error', 'userId is required'); END IF;
    UPDATE public.users
    SET admin_approval_status = 'approved', updated_date = now()
    WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true);
  END IF;

  ------------------ reject ------------------
  IF p_action = 'reject' THEN
    IF p_user_id IS NULL THEN RETURN jsonb_build_object('error', 'userId is required'); END IF;
    UPDATE public.users
    SET admin_approval_status = 'rejected', role = 'user', staff_role = NULL, updated_date = now()
    WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true);
  END IF;

  ------------------ deactivate ------------------
  IF p_action = 'deactivate' THEN
    IF p_user_id IS NULL THEN RETURN jsonb_build_object('error', 'userId is required'); END IF;
    -- Don't allow deactivating a super_admin
    SELECT staff_role INTO v_target FROM public.users WHERE id = p_user_id;
    IF v_target.staff_role = 'super_admin' THEN
      RETURN jsonb_build_object('error', 'Cannot deactivate a super admin');
    END IF;
    UPDATE public.users
    SET role = 'user', staff_role = NULL, admin_approval_status = NULL, updated_date = now()
    WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true);
  END IF;

  ------------------ invite ------------------
  IF p_action = 'invite' THEN
    IF p_email IS NULL THEN RETURN jsonb_build_object('error', 'Email is required'); END IF;

    -- Check if auth user already exists
    SELECT id INTO v_new_user_id FROM auth.users WHERE email = p_email LIMIT 1;

    IF v_new_user_id IS NOT NULL THEN
      UPDATE public.users
      SET staff_role = p_staff_role, updated_date = now()
      WHERE id = v_new_user_id;
      RETURN jsonb_build_object('success', true, 'userUpdated', true, 'userId', v_new_user_id);
    END IF;

    -- Create a new auth user with a temp password via signUp-compatible insert
    v_temp_pass := 'Ukart' || substr(extensions.gen_salt('bf'), 1, 8) || '1!';
    v_new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, email_change_confirm_status,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token
    ) VALUES (
      v_new_user_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', p_email,
      extensions.crypt(v_temp_pass, extensions.gen_salt('bf')),
      now(), 0, '{}'::jsonb,
      jsonb_build_object('full_name', split_part(p_email, '@', 1)),
      now(), now(), '', ''
    );

    INSERT INTO public.users (id, role, staff_role, admin_approval_status, full_name)
    VALUES (v_new_user_id, 'admin', COALESCE(p_staff_role, 'support'), 'pending', COALESCE(p_full_name, split_part(p_email, '@', 1)))
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', staff_role = COALESCE(p_staff_role, 'support'),
        admin_approval_status = 'pending', updated_date = now();

    RETURN jsonb_build_object('success', true, 'userUpdated', false, 'userId', v_new_user_id, 'tempPassword', v_temp_pass);
  END IF;

  RETURN jsonb_build_object('error', 'Unknown action: ' || p_action);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.manage_staff(text, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_staff(text, uuid, text, text, text) TO authenticated;

-- ============================================================
-- Update promote_to_super_admin to accept admin name
-- ============================================================
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
  -- Gate: only works if no super admin exists yet
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
