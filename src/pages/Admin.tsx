import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchAllTracks,
  uploadAudioTrack,
  setActiveTrack,
  deleteAudioTrack,
  AudioTrack,
} from '@/lib/api';
import { audioEngine, invalidateTrackCache } from '@/lib/audioEngine';
import { toast } from 'sonner';
import { Upload, Trash2, Play, CheckCircle, ArrowLeft, Music, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // ── Load tracks ───────────────────────────────────────────────────────────
  const loadTracks = useCallback(async () => {
    setTracksLoading(true);
    const data = await fetchAllTracks();
    setTracks(data);
    setTracksLoading(false);
  }, []);

  useEffect(() => { loadTracks(); }, [loadTracks]);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!user) return;

    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File exceeds 200 MB limit.');
      return;
    }
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|ogg|wav|aac|flac|m4a)$/i)) {
      toast.error('Please upload an audio file (MP3, OGG, WAV, etc.).');
      return;
    }

    const trackName = file.name.replace(/\.[^.]+$/, ''); // strip extension
    setUploading(true);
    setUploadProgress(0);

    // Simulate progress (Supabase upload doesn't expose progress)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 8, 88));
    }, 300);

    try {
      await uploadAudioTrack(user.id, file, trackName);
      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success(`"${trackName}" uploaded successfully.`);
      await loadTracks();
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [user, loadTracks]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── Activate track ────────────────────────────────────────────────────────
  const handleActivate = async (track: AudioTrack) => {
    setActivating(track.id);
    try {
      await setActiveTrack(track.id);
      setTracks(prev => prev.map(t => ({ ...t, is_active: t.id === track.id })));
      // Reload the audio engine with the new track
      await audioEngine.reload();
      toast.success(`"${track.name}" is now the active track.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to activate track.';
      toast.error(msg);
    } finally {
      setActivating(null);
    }
  };

  // ── Delete track ──────────────────────────────────────────────────────────
  const handleDelete = async (track: AudioTrack) => {
    if (!confirm(`Delete "${track.name}"? This cannot be undone.`)) return;
    setDeleting(track.id);
    try {
      if (track.is_active) {
        invalidateTrackCache();
        audioEngine.pause();
      }
      await deleteAudioTrack(track);
      setTracks(prev => prev.filter(t => t.id !== track.id));
      toast.success(`"${track.name}" deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete track.';
      toast.error(msg);
    } finally {
      setDeleting(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  const activeTrack = tracks.find(t => t.is_active);

  return (
    <div className="min-h-screen bg-[#08080f] text-[#f0ebe0]">
      {/* Header */}
      <div className="border-b border-white/7 px-6 py-4 flex items-center gap-4"
        style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(20px)' }}>
        <button
          onClick={() => navigate('/stream')}
          className="p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/8 transition-all"
          aria-label="Back to stream"
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-[#f0ebe0] font-semibold tracking-wide">Scruttin Admin</h1>
          <p className="text-white/35 text-xs">{user.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(196,181,253,0.12)', color: '#c4b5fd', border: '1px solid rgba(196,181,253,0.2)' }}>
            Admin
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* Active track summary */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(196,181,253,0.12)', border: '1px solid rgba(196,181,253,0.2)' }}>
              <Music size={15} style={{ color: '#c4b5fd' }} />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-[0.18em]">Now Playing Globally</p>
              <p className="text-[#f0ebe0] font-medium text-sm mt-0.5">
                {activeTrack ? activeTrack.name : <span className="text-white/30 italic">No active track — upload one below</span>}
              </p>
            </div>
            {activeTrack && (
              <span className="ml-auto text-xs text-white/30">{formatBytes(activeTrack.file_size)}</span>
            )}
          </div>
        </div>

        {/* Upload zone */}
        <section>
          <h2 className="text-sm font-semibold text-white/55 tracking-[0.14em] uppercase mb-4">Upload Audio Track</h2>
          <div
            className={cn(
              'rounded-2xl border-2 border-dashed transition-all cursor-pointer relative',
              dragOver
                ? 'border-purple-400/50 bg-purple-400/5'
                : 'border-white/10 hover:border-white/18 hover:bg-white/2',
            )}
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            aria-label="Upload audio file"
          >
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.mp3,.ogg,.wav,.aac,.flac,.m4a"
              className="hidden"
              onChange={handleFileInput}
            />

            <div className="px-8 py-12 flex flex-col items-center gap-3 text-center">
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-purple-300 animate-spin" />
                  <p className="text-white/55 text-sm">Uploading…</p>
                  <div className="w-56 h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-400 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-white/30 text-xs">{uploadProgress}%</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Upload size={20} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-[#f0ebe0]/70 text-sm font-medium">
                      {dragOver ? 'Drop it here' : 'Click or drag an audio file'}
                    </p>
                    <p className="text-white/30 text-xs mt-1">MP3, OGG, WAV, FLAC, M4A — up to 200 MB</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Track list */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/55 tracking-[0.14em] uppercase">All Tracks</h2>
            <button onClick={loadTracks} className="text-xs text-white/30 hover:text-white/55 transition-colors">
              Refresh
            </button>
          </div>

          {tracksLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/8 py-12 flex flex-col items-center gap-2 text-center">
              <Music size={28} className="text-white/15" />
              <p className="text-white/30 text-sm">No tracks uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map(track => (
                <div
                  key={track.id}
                  className={cn(
                    'rounded-xl px-5 py-4 flex items-center gap-4 transition-all',
                    track.is_active
                      ? 'border'
                      : 'border',
                  )}
                  style={{
                    background: track.is_active ? 'rgba(196,181,253,0.06)' : 'rgba(255,255,255,0.03)',
                    borderColor: track.is_active ? 'rgba(196,181,253,0.22)' : 'rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Active indicator / play button */}
                  <div className="flex-shrink-0">
                    {track.is_active ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(196,181,253,0.18)', border: '1px solid rgba(196,181,253,0.35)' }}>
                        <CheckCircle size={15} style={{ color: '#c4b5fd' }} />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleActivate(track)}
                        disabled={activating === track.id}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-all disabled:opacity-40"
                        title="Set as active track"
                      >
                        {activating === track.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Play size={14} />
                        }
                      </button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm font-medium truncate', track.is_active ? 'text-[#f0ebe0]' : 'text-white/62')}>
                        {track.name}
                      </p>
                      {track.is_active && (
                        <span className="text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(196,181,253,0.15)', color: '#c4b5fd' }}>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-white/28 text-xs mt-0.5">
                      {formatBytes(track.file_size)} · {formatDate(track.uploaded_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!track.is_active && (
                      <button
                        onClick={() => handleActivate(track)}
                        disabled={activating === track.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/8 transition-all disabled:opacity-40"
                      >
                        {activating === track.id ? 'Setting…' : 'Set Active'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(track)}
                      disabled={deleting === track.id}
                      className="p-2 rounded-lg text-white/22 hover:text-red-400 hover:bg-red-500/8 transition-all disabled:opacity-40"
                      title="Delete track"
                    >
                      {deleting === track.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer note */}
        <p className="text-center text-white/18 text-xs pb-6 leading-relaxed">
          The active track plays site-wide for all Scruttin users.<br />
          Switching tracks takes effect within a few seconds.
        </p>
      </div>
    </div>
  );
}
