import { useState, useEffect, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User, UserSettings } from '@/types';
import { loadUserProfile, updateUserProfile, uploadAvatar } from '@/lib/api';

const DEFAULT_SETTINGS: UserSettings = {
  defaultAtmosphere: 'night',
  volume: 0.5,
  textSize: 'md',
  enableVoiceAudio: true,
  autoPlayVoice: false,
};

function mapUser(
  su: SupabaseUser,
  profile?: { avatar_url?: string | null; settings?: Partial<UserSettings> | null; is_admin?: boolean | null },
): User {
  return {
    id: su.id,
    email: su.email!,
    avatarUrl: profile?.avatar_url ?? su.user_metadata?.avatar_url ?? undefined,
    isAdmin: profile?.is_admin ?? false,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(profile?.settings as Partial<UserSettings> ?? {}),
    },
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrate = async (su: SupabaseUser) => {
      const profile = await loadUserProfile(su.id);
      if (!mounted) return;
      setUser(mapUser(su, profile ?? undefined));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        hydrate(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        hydrate(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        hydrate(session.user);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const sendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    return data.user!;
  }, []);

  const signIn = useCallback(async (email: string, token: string) => {
    const su = await verifyOtp(email, token);
    const profile = await loadUserProfile(su.id);
    setUser(mapUser(su, profile ?? undefined));
  }, [verifyOtp]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateAvatar = useCallback(async (file: File) => {
    if (!user) return;
    const url = await uploadAvatar(user.id, file);
    if (url) {
      await updateUserProfile(user.id, { avatar_url: url });
      setUser(prev => prev ? { ...prev, avatarUrl: url } : prev);
    }
  }, [user]);

  const updateSettings = useCallback(async (settings: Partial<UserSettings>) => {
    if (!user) return;
    const merged = { ...user.settings, ...settings };
    setUser(prev => prev ? { ...prev, settings: merged } : prev);
    await updateUserProfile(user.id, { settings: merged });
  }, [user]);

  return { user, loading, sendOtp, verifyOtp, signIn, signOut, updateAvatar, updateSettings };
}
