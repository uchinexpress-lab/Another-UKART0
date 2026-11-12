import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';

// Landing point for Google/Apple OAuth redirects. Supabase reads the session
// from the URL, the DB trigger has already created the profile row, and the
// app's auth listener picks the new session up from here.
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('return_to') || '/';
      // detectSessionInUrl handles the hash fragment; give it a beat, then check.
      let session = null;
      for (let i = 0; i < 10 && !session; i++) {
        const { data } = await supabase.auth.getSession();
        session = data?.session;
        if (!session) await new Promise((r) => setTimeout(r, 300));
      }
      if (session) {
        window.location.replace(returnTo);
      } else {
        setError('Sign-in could not be completed. Please try again.');
      }
    };
    finish();
  }, [navigate]);

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
