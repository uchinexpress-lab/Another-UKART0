import { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';

// Landing point for Google/Apple OAuth redirects. Supabase reads the session
// from the URL hash (detectSessionInUrl), the DB trigger has already created
// the profile row, and the app's auth listener picks the new session up.
export default function OAuthCallback() {
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('return_to') || '/';

    let settled = false;

    // The Supabase client has detectSessionInUrl: true, so on a full page load
    // (which OAuth redirects always are) it parses the hash and establishes the
    // session automatically.  Listen for the auth state change it fires, and
    // also poll getSession as a fallback in case the event already fired before
    // this component mounted.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (settled) return;
      if (event === 'SIGNED_IN' && session?.user) {
        settled = true;
        window.location.replace(returnTo);
      } else if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // ignore — wait for SIGNED_IN
      }
    });

    // Fallback: check if the session was already established before the
    // listener was attached (detectSessionInUrl runs on client init).
    (async () => {
      // Small delay to let detectSessionInUrl finish processing the hash.
      await new Promise((r) => setTimeout(r, 500));
      if (settled) return;
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        settled = true;
        window.location.replace(returnTo);
        return;
      }
      // If no error param either, keep waiting a bit more.
      await new Promise((r) => setTimeout(r, 1500));
      if (settled) return;
      const { data: retry } = await supabase.auth.getSession();
      if (retry?.session?.user) {
        settled = true;
        window.location.replace(returnTo);
      } else {
        settled = true;
        setError('Sign-in could not be completed. Please try again.');
      }
    })();

    return () => {
      settled = true;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      {error ? (
        <>
          <p className="text-sm text-destructive">{error}</p>
          <a href="/login" className="text-sm text-primary font-medium hover:underline">
            Back to login
          </a>
        </>
      ) : (
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      )}
    </div>
  );
}
