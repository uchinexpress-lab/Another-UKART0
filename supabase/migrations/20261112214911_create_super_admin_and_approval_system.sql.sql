-- 1. Add admin approval status to users table
alter table public.users add column if not exists admin_approval_status text
  default 'approved' check (admin_approval_status in ('pending','approved','rejected'));

-- Only super_admin accounts can be 'approved' by default; new admin promotions start 'pending'.
-- Existing users keep 'approved' so nothing breaks.

-- 2. Create the super admin auth account
-- Using the Supabase admin API via SQL is not possible directly; instead we use
-- a SECURITY DEFINER function to create the user, then set their profile.

-- First, check if user already exists in auth.users
do $$
declare
  v_user_id uuid;
begin
  -- Try to find existing user by email
  select id into v_user_id from auth.users where email = 'ukartfreshventures@gmail.com';

  if v_user_id is null then
    -- Create the auth user with encrypted password
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      email_confirmed_at,
      encrypted_password,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'ukartfreshventures@gmail.com',
      now(),
      crypt('Ukart2026@@', gen_salt('bf')),
      jsonb_build_object('role', 'admin'),
      jsonb_build_object('full_name', 'Ukart Super Admin'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    on conflict do nothing
    returning id into v_user_id;
  else
    -- User exists; update their password and metadata
    update auth.users set
      encrypted_password = crypt('Ukart2026@@', gen_salt('bf')),
      raw_app_meta_data = jsonb_build_object('role', 'admin'),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', 'Ukart Super Admin'),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  -- Upsert the profile row as super_admin
  insert into public.users (id, full_name, role, staff_role, admin_approval_status)
  values (v_user_id, 'Ukart Super Admin', 'admin', 'super_admin', 'approved')
  on conflict (id) do update set
    role = 'admin',
    staff_role = 'super_admin',
    admin_approval_status = 'approved',
    full_name = coalesce(public.users.full_name, 'Ukart Super Admin'),
    updated_date = now();
end;
$$;

-- 3. SECURITY DEFINER function to promote/demote/approve staff
-- Called from the inviteStaff edge function (service role key bypasses RLS).
create or replace function public.promote_staff(
  p_target_user_id uuid,
  p_action text,
  p_staff_role text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_target_role text;
  v_target_staff_role text;
  v_target_approval text;
  v_result jsonb;
begin
  -- Fetch current state of target user
  select role, staff_role, admin_approval_status
  into v_target_role, v_target_staff_role, v_target_approval
  from public.users where id = p_target_user_id;

  if not found then
    return jsonb_build_object('error', 'User not found');
  end if;

  case p_action
    when 'promote' then
      -- Promote Base44 role to admin; staff_role stays as-is or gets set
      update public.users set
        role = 'admin',
        staff_role = coalesce(p_staff_role, v_target_staff_role, 'support'),
        admin_approval_status = 'pending',
        updated_date = now()
      where id = p_target_user_id;

    when 'updateRole' then
      if p_staff_role is null then
        return jsonb_build_object('error', 'staff_role required for updateRole');
      end if;
      update public.users set
        staff_role = p_staff_role,
        updated_date = now()
      where id = p_target_user_id;

    when 'approve' then
      -- Approve an admin account: set status to approved
      update public.users set
        admin_approval_status = 'approved',
        updated_date = now()
      where id = p_target_user_id;

    when 'reject' then
      -- Reject: demote back to user and set status
      update public.users set
        admin_approval_status = 'rejected',
        role = 'user',
        staff_role = null,
        updated_date = now()
      where id = p_target_user_id;

    when 'deactivate' then
      -- Remove admin access entirely
      update public.users set
        role = 'user',
        staff_role = null,
        admin_approval_status = null,
        updated_date = now()
      where id = p_target_user_id;

    when 'invite' then
      -- For invite: the edge function handles email sending;
      -- this just sets the role if the user already exists
      update public.users set
        staff_role = p_staff_role,
        updated_date = now()
      where id = p_target_user_id and role = 'admin';

    else
      return jsonb_build_object('error', 'Unknown action: ' || p_action);
  end case;

  select jsonb_build_object(
    'success', true,
    'user_id', p_target_user_id,
    'action', p_action
  ) into v_result;

  return v_result;
end;
$$;

-- Revoke execute from public/anon; only service_role (edge functions) should call it
revoke execute on function public.promote_staff(uuid, text, text) from public, anon, authenticated;

-- 4. Update is_admin to also check approval status
-- An admin is only "admin" if their approval_status is 'approved'
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (
      select coalesce(raw_app_meta_data->>'role' = 'admin', false)
      from auth.users where id = auth.uid()
    ),
    (select role = 'admin' from public.users where id = auth.uid())
  )
  and coalesce(
    (select admin_approval_status = 'approved' from public.users where id = auth.uid()),
    true
  );
$$;
