-- Drop promote_staff function — it may be causing PostgREST schema cache errors.
-- The inviteStaff edge function will handle staff mutations directly with the
-- service role key instead of calling a database function.

drop function if exists public.promote_staff(uuid, text, text);

-- Ensure is_admin is exactly the original working version
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (
      select coalesce(raw_app_meta_data->>'role' = 'admin', false)
      from auth.users where id = auth.uid()
    ),
    (select role = 'admin' from public.users where id = auth.uid())
  );
$$;
