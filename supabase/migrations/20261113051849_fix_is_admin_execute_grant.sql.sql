/*
# Fix is_admin permission denied error

A previous migration revoked EXECUTE on is_admin() from anon and authenticated.
But the RLS policy on public.users uses `id = auth.uid() OR is_admin()` —
when is_admin() throws "permission denied", the entire policy fails and
the user can't read their own profile row, even though id = auth.uid()
should match.

is_admin() is a STABLE SECURITY DEFINER function that only reads auth.users
and public.users to check a role. It's safe to grant EXECUTE to authenticated.
*/

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
