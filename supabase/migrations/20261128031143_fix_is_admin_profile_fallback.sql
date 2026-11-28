/*
  # Fix admin authorization when profile role is authoritative

  1. Problem
    - The admin helper previously used COALESCE around the auth metadata check.
      For any signed-in account with a JWT, an old or missing metadata role could
      return false and prevent the helper from checking the current public.users
      profile row.
    - This caused an approved admin to see the staff page but have product
      deletes and other admin writes silently affect zero rows under RLS.

  2. Modified database object
    - Replace public.is_admin() with an OR check between the immutable
      raw_app_meta_data role and the approved public.users role.

  3. Security
    - The function remains SECURITY DEFINER with search_path fixed to public.
    - Only an authenticated user's own profile row is checked through auth.uid().
    - No anonymous access or table policy is broadened.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.id = au.id
    WHERE au.id = auth.uid()
      AND (
        COALESCE(au.raw_app_meta_data->>'role', '') = 'admin'
        OR pu.role = 'admin'
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
