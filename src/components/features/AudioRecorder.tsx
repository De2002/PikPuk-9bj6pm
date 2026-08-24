/**
 * AudioRecorder — inline component for the Composer.
 * Lets users either:
 *   1. Record a voice clip using the microphone (MediaRecorder API)
 *   2. Upload an audio file from their device
 *
 * Returns a File via onFile callback.
 * Accepts onRemove to clear the attached audio.
 */
import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Play, Pause, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { audioEngine } from '@/lib/audioEngine';

interface Props {
  audioFile: File | null;
  onFile: (f: File | null) => void;
  typeColor: string;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function AudioRecorder({ audioFile, onFile, typeColor }: Props) {
  // ── recorder state ─────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'idle' | 'recording' | 'stopping' | 'preview'>('idle');
  const musicWasPlayingRef = useRef(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [playSeconds, setPlaySeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [requestingMic, setRequestingMic] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    };
  }, []);

  // When audioFile is cleared externally
  useEffect(() => {
    if (!audioFile) {
      setMode('idle');
      setRecSeconds(0);
      setPlaySeconds(0);
      setIsPlaying(false);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
      if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
    }
  }, [audioFile]);

  // ── recording ──────────────────────────────────────────────────────────────
  const startRecording = async () => {
    setRequestingMic(true);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error('Microphone access denied.');
      setRequestingMic(false);
      return;
    }
    setRequestingMic(false);

    // Pause background music while recording so mic doesn't pick it up
    musicWasPlayingRef.current = audioEngine.isPlaying;
    if (audioEngine.isPlaying) audioEngine.pause();

    chunksRef.current = [];
    // Pick best supported MIME type across browsers
    const mimeType = (
      ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4']
        .find(t => MediaRecorder.isTypeSupported(t))
    ) ?? '';
    const mr = new MediaRecorder(stream, { mimeType });

    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const effectiveMime = mimeType || 'audio/webm';
      const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: effectiveMime });
      if (file.size < 100) { toast.error('Recording was empty — try again.'); setMode('idle'); return; }
      if (file.size > 20_000_000) { toast.error('Recording too large (max 20 MB).'); setMode('idle'); return; }
      // Resume music after recording
      if (musicWasPlayingRef.current) audioEngine.play();
      commitFile(file);
    };

    mr.start(200);
    mediaRecorderRef.current = mr;
    setMode('recording');
    setRecSeconds(0);
    timerRef.current = setInterval(() => {
      setRecSeconds(s => {
        if (s >= 299) { stopRecording(); return s; } // max 5 min
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (!mediaRecorderRef.current) return;
    setMode('stopping'); // show brief spinner while onstop fires
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
  };

  // ── file upload ────────────────────────────────────────────────────────────
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 20_000_000) { toast.error('File must be under 20 MB.'); return; }
    commitFile(f);
  };

  // ── shared commit ──────────────────────────────────────────────────────────
  const commitFile = (f: File) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(f);

    const el = new Audio(previewUrlRef.current);
    el.onloadedmetadata = () => setDuration(el.duration);
    el.ontimeupdate = () => setPlaySeconds(el.currentTime);
    el.onended = () => { setIsPlaying(false); setPlaySeconds(0); };
    if (audioRef.current) { audioRef.current.pause(); }
    audioRef.current = el;

    setMode('preview');
    setPlaySeconds(0);
    setIsPlaying(false);
    onFile(f);
  };

  const removeAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
    setMode('idle');
    setPlaySeconds(0);
    setIsPlaying(false);
    onFile(null);
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      if (el.ended || el.currentTime >= el.duration) { el.currentTime = 0; }
      el.play();
      setIsPlaying(true);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  if (mode === 'idle') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={startRecording}
          disabled={requestingMic}
          className="flex items-center gap-1.5 text-sm text-white/38 hover:text-white/68 transition-colors"
          title="Record a voice note"
        >
          {requestingMic
            ? <Loader2 size={14} className="animate-spin" />
            : <Mic size={14} />
          }
          <span>Record</span>
        </button>

        <span className="text-white/15 text-xs">or</span>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-sm text-white/38 hover:text-white/68 transition-colors"
          title="Upload an audio file"
        >
          <Upload size={13} />
          <span>Upload audio</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.ogg,.wav,.aac,.webm,.m4a"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  if (mode === 'stopping') {
    return (
      <div className="flex items-center gap-2 text-sm text-white/38">
        <Loader2 size={14} className="animate-spin" />
        <span>Processing…</span>
      </div>
    );
  }

  if (mode === 'recording') {
    return (
      <div className="flex items-center gap-3">
        {/* Pulsing mic indicator */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute w-7 h-7 rounded-full animate-ping"
            style={{ background: `${typeColor}28` }}
          />
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: `${typeColor}22`, border: `1px solid ${typeColor}55` }}
          >
            <Mic size={10} style={{ color: typeColor }} />
          </div>
        </div>

        <span className="text-sm font-mono tabular-nums" style={{ color: typeColor }}>
          {formatTime(recSeconds)}
        </span>

        {/* Animated sound bars */}
        <div className="flex items-end gap-[2px] h-4">
          {[3,5,4,6,3,5,4].map((h, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 2,
                height: `${h * 2}px`,
                background: typeColor,
                opacity: 0.55,
                animationName: 'soundBar',
                animationDuration: `${0.5 + i * 0.08}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                animationDelay: `${i * 0.06}s`,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1.5 text-sm text-white/55 hover:text-white/88 transition-colors ml-auto"
          title="Stop recording"
        >
          <Square size={12} fill="currentColor" />
          <span>Stop</span>
        </button>
      </div>
    );
  }

  // preview mode
  const progress = duration > 0 ? (playSeconds / duration) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-3 py-2"
      style={{ background: `${typeColor}0e`, border: `1px solid ${typeColor}22` }}>
      <button
        type="button"
        onClick={togglePlay}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: `${typeColor}1a`, border: `1px solid ${typeColor}38` }}
      >
        {isPlaying
          ? <Pause size={11} style={{ color: typeColor }} fill="currentColor" />
          : <Play size={11} style={{ color: typeColor }} fill="currentColor" />
        }
      </button>

      {/* Waveform-style progress bar */}
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/8">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${progress}%`, background: typeColor, opacity: 0.65 }}
        />
      </div>

      <span className="text-[11px] font-mono tabular-nums text-white/35 flex-shrink-0">
        {formatTime(playSeconds)}{duration > 0 ? ` / ${formatTime(duration)}` : ''}
      </span>

      <button
        type="button"
        onClick={removeAudio}
        className="p-1 text-white/25 hover:text-red-400 transition-colors flex-shrink-0"
        title="Remove audio"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
