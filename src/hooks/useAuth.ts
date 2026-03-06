import { useState, useEffect } from 'react';
import { supabase } from '@/lib/api/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from './useToast';
import { logger } from '@/lib/utils/logger';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      logger.warn('Supabase not configured — auth features disabled.');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!supabase) {
      toast.error('Supabase tidak dikonfigurasi.');
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Berhasil keluar');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal keluar';
      toast.error(message);
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
