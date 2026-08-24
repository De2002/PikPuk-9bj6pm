import { useState, useCallback, useRef, useEffect } from 'react';
import { Moment, SpaceId } from '@/types';
import { fetchMoments, markImpression, passOnMoment } from '@/lib/api';
import { shuffle } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const BUFFER_SIZE = 8;
const REFETCH_THRESHOLD = 3;

export function useStream(viewerId: string | null) {
  const [queue, setQueue]           = useState<Moment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading]       = useState(false);
  const fetchedRef                  = useRef(false);
  const viewerIdRef                 = useRef(viewerId);

  useEffect(() => { viewerIdRef.current = viewerId; }, [viewerId]);

  // Initial fetch from DB
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    fetchMoments(viewerId, BUFFER_SIZE * 2).then(moments => {
      if (moments.length > 0) { setQueue(shuffle(moments)); setCurrentIndex(0); }
      setLoading(false);
    });
  }, [viewerId]);

  const safeIndex = queue.length > 0 ? currentIndex % queue.length : 0;
  const currentMoment: Moment | null = queue[safeIndex] ?? null;

  const prevMoment: Moment | null = queue.length > 1 ? queue[(safeIndex - 1 + queue.length) % queue.length] : null;
  const nextMomentPeek: Moment | null = queue.length > 1 ? queue[(safeIndex + 1) % queue.length] : null;

  const maybePrefetch = useCallback(async () => {
    const remaining = queue.length - currentIndex - 1;
    if (remaining <= REFETCH_THRESHOLD && !loading) {
      const more = await fetchMoments(viewerIdRef.current, BUFFER_SIZE);
      if (more.length > 0) {
        setQueue(prev => {
          const ids = new Set(prev.map(m => m.id));
          const fresh = more.filter(m => !ids.has(m.id));
          return [...prev, ...shuffle(fresh)];
        });
      }
    }
  }, [queue.length, currentIndex, loading]);

  const nextMoment = useCallback(() => {
    const cur = queue[safeIndex];
    if (cur && viewerIdRef.current) markImpression(viewerIdRef.current, cur.id);
    setCurrentIndex(n => n + 1);
    maybePrefetch();
  }, [safeIndex, queue, maybePrefetch]);

  /** Pass: permanently hide this moment from this viewer, skip immediately */
  const passAndSkip = useCallback(async () => {
    const cur = queue[safeIndex];
    if (cur) await passOnMoment(viewerIdRef.current, cur.id);
    setCurrentIndex(n => n + 1);
    maybePrefetch();
  }, [safeIndex, queue, maybePrefetch]);

  const addMoment = useCallback((moment: Moment) => {
    setQueue(prev => {
      const copy = [...prev];
      const insertAt = prev.length > 0 ? (currentIndex % prev.length) + 1 : 0;
      copy.splice(insertAt, 0, moment);
      return copy;
    });
  }, [currentIndex]);

  // Realtime: new moments from other users
  useEffect(() => {
    const channel = makeRealtimeChannel(setQueue);
    return () => { channel.unsubscribe(); };
  }, []);

  return {
    currentMoment,
    nextMoment,
    passAndSkip,
    addMoment,
    loading,
    neighbours: [prevMoment, nextMomentPeek] as [Moment | null, Moment | null],
  };
}

// ── Realtime subscription ─────────────────────────────────────────────────────
function makeRealtimeChannel(setQueue: React.Dispatch<React.SetStateAction<Moment[]>>) {
  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face';

  return supabase
    .channel('public:moments')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'moments', filter: 'moderation_status=eq.approved' },
      async (payload) => {
        const row = payload.new as {
          id: string; type: 'dream' | 'thought'; body: string;
          title: string | null; author_name: string | null;
          website_url: string | null; space: string | null;
          polaroid_url: string | null; audio_url: string | null;
          user_id: string;
        };
        const { data: profile } = await supabase
          .from('user_profiles').select('avatar_url').eq('id', row.user_id).single();

        const moment: Moment = {
          id: row.id, type: row.type, body: row.body,
          title: row.title ?? undefined,
          authorName: row.author_name ?? undefined,
          websiteUrl: row.website_url ?? undefined,
          space: (row.space ?? 'general') as SpaceId,
          polaroidUrl: row.polaroid_url ?? undefined,
          audioUrl: row.audio_url ?? undefined,
          avatarUrl: (profile as { avatar_url: string | null } | null)?.avatar_url ?? defaultAvatar,
        };
        setQueue(prev => prev.some(m => m.id === moment.id) ? prev : [...prev, moment]);
      }
    )
    .subscribe();
}
