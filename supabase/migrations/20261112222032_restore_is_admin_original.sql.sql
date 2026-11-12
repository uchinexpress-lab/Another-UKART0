-- Restore is_admin() to EXACTLY its original form.
-- The modifications to check admin_approval_status inside is_admin() broke
-- PostgREST schema loading, causing "Database error querying schema" at login.
-- Approval checking is now handled in the frontend only.

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
