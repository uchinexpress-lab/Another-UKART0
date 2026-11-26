/*
  # Prevent users from granting themselves admin rights

  1. Security
    - public.users previously granted UPDATE on ALL columns to anon and
      authenticated. Combined with the own-row update policy, any signed-in user
      could set role = 'admin', staff_role = 'super_admin' and
      admin_approval_status = 'approved' on their own profile, which is exactly what
      public.is_admin() trusts.
    - This migration revokes the table-wide UPDATE grant and re-grants UPDATE only
      on the profile columns the app actually edits (full_name, phone,
      date_of_birth, avatar_url, saved_addresses, saved_cards,
      notification_preferences, language, deletion_requested).
    - role, staff_role and admin_approval_status can now only be changed by
      service-role code (the inviteStaff edge function) and the SECURITY DEFINER
      staff management functions.

  2. Notes
    - SELECT, INSERT and DELETE grants are unchanged; row level security still
      decides which rows are visible or writable.
*/

REVOKE UPDATE ON public.users FROM anon;
REVOKE UPDATE ON public.users FROM authenticated;

GRANT UPDATE (
  full_name,
  phone,
  date_of_birth,
  avatar_url,
  saved_addresses,
  saved_cards,
  notification_preferences,
  language,
  deletion_requested,
  updated_date
) ON public.users TO authenticated;
