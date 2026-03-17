import { useState, useEffect } from 'react';
import { supabase } from '@/lib/api/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from './useToast';
import { logger } from '@/lib/utils/logger';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[Auth] Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('[Auth] Profile fetch failed:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!supabase) {
      logger.warn('Supabase not configured — auth features disabled.');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      const currentUser = s?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id).then(p => setProfile(p));
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      const currentUser = s?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        setLoading(true);
        const p = await fetchProfile(currentUser.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!supabase) {
      toast.error('Koneksi ke layanan basis data (Supabase) belum dikonfigurasi. Silakan hubungi administrator.');
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Berhasil keluar');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mencoba keluar.';
      toast.error(message);
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
};
