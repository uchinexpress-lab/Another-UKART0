/*
  # Stop public reading of every customer profile

  1. Security
    - Drops policy "Allow users read own or public profile" on public.users, which
      was SELECT TO anon, authenticated USING (true) and exposed every profile
      (name, phone, date of birth, saved addresses, saved cards) to the internet.
    - users_read_own_or_admin remains: a user reads their own profile, admins read all.
*/

DROP POLICY IF EXISTS "Allow users read own or public profile" ON public.users;
