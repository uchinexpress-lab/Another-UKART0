/*
# Drop unused login_with_setup_code function

The setup flow uses client-side supabase.auth.signUp() + promote_to_super_admin
RPC instead, since GoTrue password hashing can't be replicated in PL/pgSQL.
*/

DROP FUNCTION IF EXISTS public.login_with_setup_code(text, text, text);
