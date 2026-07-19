import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function getFirstName(user) {
  if (!user) return '';
  const base = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : '');
  if (!base) return '';
  const first = base.split(/[ ._-]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function useCurrentUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return user;
}
