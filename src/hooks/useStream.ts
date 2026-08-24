
import { useState, useCallback, useRef, useEffect } from 'react';
import { Moment } from '@/types';
import { fetchMoments, markImpression } from '@/lib/api';
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
  }, [viewerId, setQueue]); // Add setQueue to dependencies, or consider if this effect should only run once without it

  const safeIndex     = queue.length > 0 ? currentIndex % queue.length : 0;
  const currentMoment: Moment | null = queue[safeIndex] ?? null;

  // Neighbours for Film/Carousel ghost frames — never readable, just for visual
  const prevMoment: Moment | null = queue.length > 1 ? queue[(safeIndex - 1 + queue.length) % queue.length] : null;
  const nextMomentPeek: Moment | null = queue.length > 1 ? queue[(safeIndex + 1) % queue.length] : null;

  // Prefetch more when buffer is running low
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
  }, [queue.length, currentIndex, loading, setQueue]);

  const nextMoment = useCallback(() => {
    const cur = queue[safeIndex];
    if (cur && viewerIdRef.current) markImpression(viewerIdRef.current, cur.id);
    setCurrentIndex(n => n + 1);
    maybePrefetch();
  }, [safeIndex, queue, maybePrefetch, setCurrentIndex]);

  const addMoment = useCallback((moment: Moment) => {
    setQueue(prev => {
      const copy = [...prev];
      const insertAt = prev.length > 0 ? (currentIndex % prev.length) + 1 : 0;
      copy.splice(insertAt, 0, moment);
      return copy;
    });
  }, [currentIndex, setQueue]);

  // Realtime: new moments from other users append to end of queue
  useEffect(() => {
    const channel = makeRealtimeChannel(setQueue);
    return () => { channel.unsubscribe(); };
  }, [setQueue]);

  return {
    currentMoment,
    nextMoment,
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
          polaroid_url: string | null; user_id: string;
        };
        const { data: profile } = await supabase
          .from('user_profiles').select('avatar_url').eq('id', row.user_id).single();

        const moment: Moment = {
          id: row.id, type: row.type, body: row.body,
          polaroidUrl: row.polaroid_url ?? undefined,
          audioUrl: (row as unknown as { audio_url?: string }).audio_url ?? undefined,
          avatarUrl: (profile as { avatar_url: string | null } | null)?.avatar_url ?? defaultAvatar,
        };
        setQueue(prev => prev.some(m => m.id === moment.id) ? prev : [...prev, moment]);
      }
    )
    .subscribe();
}
