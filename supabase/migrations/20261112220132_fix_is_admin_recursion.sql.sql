-- Fix is_admin() to avoid recursion and null logic issues.
create or replace function public.is_admin() returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_meta_role text;
  v_profile_role text;
  v_approval text;
begin
  if auth.uid() is null then
    return false;
  end if;

  -- Check app metadata (set by promote_staff)
  begin
    select raw_app_meta_data->>'role' into v_meta_role
    from auth.users where id = auth.uid();
  exception when others then
    v_meta_role := null;
  end;

  -- Check profile role and approval status with recursion guard
  begin
    select role, admin_approval_status into v_profile_role, v_approval
    from public.users where id = auth.uid();
  exception when others then
    v_profile_role := null;
    v_approval := null;
  end;

  -- Admin if metadata or profile says admin
  if coalesce(v_meta_role = 'admin', false) or coalesce(v_profile_role = 'admin', false) then
    -- Super admins and users without approval field are approved (backward compat)
    if v_approval is null then
      return true;
    end if;
    return v_approval = 'approved';
  end if;

  return false;
end;
$$;
