import { supabase } from './supabase';
import { Moment, UserSettings } from '@/types';

// ── Moments ──────────────────────────────────────────────────────────────────

/**
 * Fetch a batch of moments the viewer hasn't seen yet.
 * Returns only approved moments from the connected database; anonymous viewers can still browse public moments.
 */
export async function fetchMoments(
  viewerId: string | null,
  limit = 15
): Promise<Moment[]> {
  // Build base query — approved active moments
  let query = supabase
    .from('moments')
    .select('id, type, body, title, author_name, website_url, space, polaroid_url, audio_url, user_id, user_profiles!inner(avatar_url)')
    .eq('moderation_status', 'approved')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit * 3); // over-fetch to filter locally

  const { data, error } = await query;

  if (error) {
    console.log('[api] fetchMoments database error', error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Filter out already-served moments for authenticated viewers
  let rows = data as unknown as Array<{
    id: string;
    type: 'dream' | 'thought';
    body: string;
    title: string | null;
    author_name: string | null;
    website_url: string | null;
    space: string | null;
    polaroid_url: string | null;
    audio_url: string | null;
    user_id: string;
    user_profiles: { avatar_url: string | null } | null;
  }>;

  if (viewerId) {
    // Get IDs already served to this viewer (last 200)
    const { data: seenData } = await supabase
      .from('impressions')
      .select('moment_id')
      .eq('viewer_id', viewerId)
      .order('served_at', { ascending: false })
      .limit(200);

    const seenSet = new Set((seenData ?? []).map((r: { moment_id: string }) => r.moment_id));
    rows = rows.filter(r => !seenSet.has(r.id));

    // If we've seen everything, just return all (start fresh)
    if (rows.length === 0) rows = data as typeof rows;
  }

  // Map to Moment interface
  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face';
  return rows.slice(0, limit).map(r => ({
    id: r.id,
    type: r.type,
    body: r.body,
    title: r.title ?? undefined,
    authorName: r.author_name ?? undefined,
    websiteUrl: r.website_url ?? undefined,
    space: (r.space ?? 'general') as import('@/types').SpaceId,
    polaroidUrl: r.polaroid_url ?? undefined,
    audioUrl: r.audio_url ?? undefined,
    avatarUrl: (r.user_profiles as { avatar_url: string | null } | null)?.avatar_url ?? defaultAvatar,
  }));
}

/** Mark moment as fully served (impression completed) */
export async function markImpression(viewerId: string, momentId: string) {
  const { error } = await supabase.from('impressions').upsert(
    { viewer_id: viewerId, moment_id: momentId, completed_at: new Date().toISOString() },
    { onConflict: 'viewer_id,moment_id' }
  );
  if (error) console.log('[api] markImpression error', error.message);
}

/** Permanently pass on a moment (mark as served so it never appears again) */
export async function passOnMoment(viewerId: string | null, momentId: string): Promise<void> {
  if (!viewerId) return;
  const { error } = await supabase.from('impressions').upsert(
    { viewer_id: viewerId, moment_id: momentId, completed_at: new Date().toISOString() },
    { onConflict: 'viewer_id,moment_id' }
  );
  if (error) console.log('[api] passOnMoment error', error.message);
}

/** Insert a new moment. Returns the created moment row. */
export async function createMoment(params: {
  userId: string;
  type: 'dream' | 'thought';
  body: string;
  title?: string;
  authorName?: string;
  websiteUrl?: string;
  space?: string;
  polaroidFile?: File;
  audioFile?: File;
  avatarUrl: string;
}): Promise<Moment | null> {
  let polaroid_url: string | undefined;
  let audio_url: string | undefined;

  if (params.polaroidFile) {
    const ext = params.polaroidFile.name.split('.').pop() ?? 'jpg';
    const path = `${params.userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('polaroids')
      .upload(path, params.polaroidFile, { cacheControl: '3600', upsert: false });
    if (!upErr) {
      const { data: urlData } = supabase.storage.from('polaroids').getPublicUrl(path);
      polaroid_url = urlData.publicUrl;
    } else {
      console.log('[api] polaroid upload error', upErr.message);
    }
  }

  if (params.audioFile) {
    const ext = params.audioFile.name.split('.').pop() ?? 'webm';
    const path = `${params.userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('voices')
      .upload(path, params.audioFile, { cacheControl: '3600', upsert: false });
    if (!upErr) {
      const { data: urlData } = supabase.storage.from('voices').getPublicUrl(path);
      audio_url = urlData.publicUrl;
    } else {
      console.log('[api] voice upload error', upErr.message);
    }
  }

  const { data, error } = await supabase
    .from('moments')
    .insert({
      user_id: params.userId,
      type: params.type,
      body: params.body,
      title: params.title ?? null,
      author_name: params.authorName ?? null,
      website_url: params.websiteUrl ?? null,
      space: params.space ?? 'general',
      polaroid_url: polaroid_url ?? null,
      audio_url: audio_url ?? null,
      language: 'en',
      moderation_status: 'approved',
      status: 'active',
    })
    .select('id, type, body, title, author_name, website_url, space, polaroid_url, audio_url')
    .single();

  if (error || !data) {
    console.log('[api] createMoment error', error?.message);
    return null;
  }

  return {
    id: data.id,
    type: data.type,
    body: data.body,
    title: data.title ?? undefined,
    authorName: data.author_name ?? undefined,
    websiteUrl: data.website_url ?? undefined,
    space: (data.space ?? 'general') as import('@/types').SpaceId,
    polaroidUrl: data.polaroid_url ?? undefined,
    audioUrl: data.audio_url ?? undefined,
    avatarUrl: params.avatarUrl,
  };
}

// ── Audio tracks ────────────────────────────────────────────────────────────

export interface AudioTrack {
  id: string;
  name: string;
  storage_path: string;
  public_url: string;
  file_size: number | null;
  is_active: boolean;
  uploaded_at: string;
}

/** Fetch the currently active track (for the audio engine) */
export async function fetchActiveTrack(): Promise<AudioTrack | null> {
  const { data, error } = await supabase
    .from('audio_tracks')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (error) console.log('[api] fetchActiveTrack error', error.message);
  return data ?? null;
}

/** Fetch all tracks (admin) */
export async function fetchAllTracks(): Promise<AudioTrack[]> {
  const { data, error } = await supabase
    .from('audio_tracks')
    .select('*')
    .order('uploaded_at', { ascending: false });
  if (error) console.log('[api] fetchAllTracks error', error.message);
  return data ?? [];
}

/** Upload an audio file and create a track record */
export async function uploadAudioTrack(
  userId: string,
  file: File,
  name: string,
): Promise<AudioTrack | null> {
  const ext = file.name.split('.').pop() ?? 'mp3';
  const path = `tracks/${Date.now()}-${name.replace(/[^a-z0-9]/gi, '_')}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('audio')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (upErr) {
    console.log('[api] uploadAudioTrack storage error', upErr.message);
    throw new Error(upErr.message);
  }

  const { data: urlData } = supabase.storage.from('audio').getPublicUrl(path);

  const { data, error } = await supabase
    .from('audio_tracks')
    .insert({
      name,
      storage_path: path,
      public_url: urlData.publicUrl,
      file_size: file.size,
      uploaded_by: userId,
      is_active: false,
    })
    .select('*')
    .single();

  if (error) {
    console.log('[api] uploadAudioTrack insert error', error.message);
    throw new Error(error.message);
  }
  return data;
}

/** Set a track as active (deactivates all others) */
export async function setActiveTrack(trackId: string): Promise<void> {
  // Deactivate all
  await supabase.from('audio_tracks').update({ is_active: false }).neq('id', trackId);
  // Activate chosen
  const { error } = await supabase.from('audio_tracks').update({ is_active: true }).eq('id', trackId);
  if (error) throw new Error(error.message);
}

/** Delete a track (removes storage object + DB row) */
export async function deleteAudioTrack(track: AudioTrack): Promise<void> {
  await supabase.storage.from('audio').remove([track.storage_path]);
  const { error } = await supabase.from('audio_tracks').delete().eq('id', track.id);
  if (error) throw new Error(error.message);
}

// ── Reports ──────────────────────────────────────────────────────────────────

export async function submitReport(reporterId: string, momentId: string, reason: string) {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    moment_id: momentId,
    reason,
  });
  if (error) console.log('[api] submitReport error', error.message);
  return !error;
}

// ── User profile ──────────────────────────────────────────────────────────────

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (error) {
    console.log('[api] uploadAvatar error', error.message);
    return null;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Bust cache with timestamp
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function updateUserProfile(userId: string, updates: {
  avatar_url?: string;
  settings?: Partial<UserSettings>;
}) {
  const payload: Record<string, unknown> = {};
  if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
  if (updates.settings) payload.settings = updates.settings;

  const { error } = await supabase
    .from('user_profiles')
    .update(payload)
    .eq('id', userId);

  if (error) console.log('[api] updateUserProfile error', error.message);
  return !error;
}

export async function loadUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, avatar_url, settings, is_admin')
    .eq('id', userId)
    .single();
  if (error) console.log('[api] loadUserProfile error', error.message);
  return data;
}
