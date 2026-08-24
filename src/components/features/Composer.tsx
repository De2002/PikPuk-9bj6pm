import { useState, useRef } from 'react';
import { MomentType } from '@/types';
import { X, Image, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import AudioRecorder from './AudioRecorder';

interface SubmitData { type: MomentType; body: string; polaroidFile?: File; audioFile?: File; }
interface Props {
  onClose: () => void;
  onSubmit: (data: SubmitData) => Promise<void>;
  userAvatar?: string;
}

// Keep text generous enough for a complete 60-second thought; audio is independent of this limit.
const MAX = 2000;

export default function Composer({ onClose, onSubmit, userAvatar }: Props) {
  const [step, setStep] = useState<'type' | 'write'>('type');
  const [type, setType] = useState<MomentType>('thought');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState<string>();
  const [polaroidFile, setPolaroidFile] = useState<File>();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const remaining = MAX - body.length;
  const nearLimit = remaining <= 100;
  const canPost = body.trim().length > 0 && remaining >= 0;
  const isDream = type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5_000_000) { toast.error('Image must be under 5 MB'); return; }
    setPolaroidFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const removePolaroid = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(undefined);
    setPolaroidFile(undefined);
  };

  const submit = async () => {
    if (!canPost || busy) return;
    setBusy(true);
    try {
      await onSubmit({ type, body: body.trim(), polaroidFile, audioFile: audioFile ?? undefined });
    } catch {
      toast.error('Something went wrong. Try again.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/58 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 glass-strong rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md mx-0 sm:mx-4 overflow-hidden">
        <button onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/38 hover:text-white/75 hover:bg-white/9 transition-colors" aria-label="Close">
          <X size={17} />
        </button>

        <div className="p-6 sm:p-8">
          {step === 'type' ? (
            <>
              <p className="text-[#f0ebe0]/55 text-sm mb-6 tracking-wide">What are you sharing?</p>
              <div className="grid grid-cols-2 gap-3">
                {(['dream', 'thought'] as MomentType[]).map(t => (
                  <button key={t} onClick={() => { setType(t); setStep('write'); }}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = t === 'dream' ? 'rgba(196,181,253,0.35)' : 'rgba(251,191,36,0.35)';
                      e.currentTarget.style.background   = t === 'dream' ? 'rgba(196,181,253,0.05)' : 'rgba(251,191,36,0.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.background   = 'rgba(255,255,255,0.02)';
                    }}>
                    <span className="text-xl" style={{
                      color: t === 'dream' ? '#c4b5fd' : '#fbbf24',
                      fontFamily: t === 'dream' ? '"Playfair Display",serif' : 'Inter,sans-serif',
                      fontStyle: t === 'dream' ? 'italic' : 'normal',
                    }}>{t === 'dream' ? 'Dream' : 'Thought'}</span>
                    <span className="text-xs text-white/35 group-hover:text-white/55 transition-colors text-center">
                      {t === 'dream' ? 'From sleep' : 'A passing idea'}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                {userAvatar && (
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/14 flex-shrink-0">
                    <img src={userAvatar} alt="" className="w-full h-full object-cover" draggable={false} />
                  </div>
                )}
                <button onClick={() => setStep('type')}
                  className="text-[10px] tracking-[0.2em] uppercase font-semibold hover:opacity-65 transition-opacity"
                  style={{ color: typeColor }}>
                  ← {type}
                </button>
              </div>

              <textarea
                value={body}
                onChange={e => setBody(e.target.value.slice(0, MAX))}
                placeholder={isDream ? 'What did you dream?' : "What's passing through your mind?"}
                autoFocus rows={4}
                className="w-full bg-transparent text-[#f0ebe0] placeholder-white/22 resize-none outline-none leading-relaxed min-h-[110px]"
                style={{
                  fontSize: '1.0625rem',
                  fontFamily: isDream ? '"Playfair Display",Georgia,serif' : 'Inter,system-ui,sans-serif',
                }}
              />

              {nearLimit && (
                <div className={cn('text-right text-xs mt-0.5 transition-colors', remaining < 0 ? 'text-red-400' : 'text-white/38')}>
                  {remaining}
                </div>
              )}

              {/* ── Attachments row ── */}
              <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
                {/* Polaroid section */}
                <div className="flex items-center gap-3">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
                  {preview ? (
                    <button onClick={removePolaroid}
                      className="flex items-center gap-2 text-sm text-white/48 hover:text-white/72 transition-colors">
                      <div className="w-7 h-7 bg-white p-0.5" style={{ paddingBottom: '0.5rem' }}>
                        <img src={preview} className="w-full h-full object-cover" alt="" />
                      </div>
                      <span>Remove Polaroid</span>
                    </button>
                  ) : (
                    <button onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 text-sm text-white/38 hover:text-white/65 transition-colors">
                      <Image size={15} /><span>Add a Polaroid</span>
                    </button>
                  )}
                </div>

                {/* Audio section */}
                <AudioRecorder
                  audioFile={audioFile}
                  onFile={setAudioFile}
                  typeColor={typeColor}
                />
              </div>

              {/* ── Submit row ── */}
              <div className="flex justify-end mt-5">
                <button onClick={submit} disabled={!canPost || busy}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-25"
                  style={{ background: canPost ? `${typeColor}18` : 'transparent', color: typeColor, border: `1px solid ${typeColor}38` }}>
                  {busy
                    ? <span className="flex items-center gap-2"><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />Letting go...</span>
                    : <><span>Let it go</span><ArrowRight size={13} /></>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
