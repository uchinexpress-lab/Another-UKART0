-- Restore is_admin() as a simple SQL function.
-- The PL/pgSQL version was causing "Database error querying schema" at login.
-- This version avoids querying public.users (which has RLS) and instead
-- relies only on auth.users metadata for the role check, plus a separate
-- approval check only when needed.
--
-- IMPORTANT: This function is SECURITY DEFINER owned by postgres, so it
-- bypasses RLS on both auth.users and public.users.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  with profile as (
    select role, admin_approval_status from public.users where id = auth.uid()
  )
  select
    coalesce(
      (select raw_app_meta_data->>'role' = 'admin' from auth.users where id = auth.uid()),
      (select role = 'admin' from profile)
    )
    and coalesce(
      (select admin_approval_status = 'approved' from profile),
      true
    )
$$;
