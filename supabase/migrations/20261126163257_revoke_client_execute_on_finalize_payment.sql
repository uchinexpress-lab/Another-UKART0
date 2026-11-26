/*
  # Stop browsers from finalizing payments

  1. Security
    - public.finalize_paystack_payment trusts the transaction JSON it is given and
      never contacts Paystack. With EXECUTE granted to anon and authenticated, a
      shopper could call it directly with fabricated "status: success" data for
      their own pending reference and receive a paid order without paying.
    - EXECUTE is revoked from PUBLIC, anon and authenticated. The only legitimate
      callers (the process-paystack-payment and paystack-webhook edge functions)
      use the service role, which is unaffected.
*/

REVOKE EXECUTE ON FUNCTION public.finalize_paystack_payment(text, text, jsonb, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_paystack_payment(text, text, jsonb, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.finalize_paystack_payment(text, text, jsonb, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paystack_payment(text, text, jsonb, text) TO service_role;
