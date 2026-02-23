import { useState, useEffect } from 'react';
import { supabase } from '@/lib/api/supabase';
import { User, Session } from '@supabase/supabase-js';
import { toast } from './useToast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase!.auth.signOut();
      if (error) throw error;
      toast.success('Berhasil keluar');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
};
