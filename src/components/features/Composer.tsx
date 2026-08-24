import { useState, useRef } from 'react';
import { MomentType, SpaceId, SPACES } from '@/types';
import { X, Image, ArrowRight, Globe, ChevronDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import AudioRecorder from './AudioRecorder';

interface SubmitData {
  type: MomentType;
  body: string;
  title?: string;
  authorName?: string;
  websiteUrl?: string;
  space: SpaceId;
  polaroidFile?: File;
  audioFile?: File;
}

interface Props {
  onClose: () => void;
  onSubmit: (data: SubmitData) => Promise<void>;
  userAvatar?: string;
  userName?: string;
}

const MAX_WORDS = 300;

function countWords(text: string) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export default function Composer({ onClose, onSubmit, userAvatar, userName }: Props) {
  const [type, setType] = useState<MomentType>('thought');
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState(userName ?? '');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [space, setSpace] = useState<SpaceId>('general');
  const [useIdentity, setUseIdentity] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [polaroidFile, setPolaroidFile] = useState<File>();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSpaceMenu, setShowSpaceMenu] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const words = countWords(body);
  const remaining = MAX_WORDS - words;
  const nearLimit = remaining <= 40;
  const overLimit = remaining < 0;
  const canPost = body.trim().length > 0 && !overLimit;
  const isDream = type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const spaceLabel = SPACES.find(s => s.id === space)?.label ?? 'General';

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

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBody(val);
  };

  const submit = async () => {
    if (!canPost || busy) return;
    setBusy(true);
    try {
      await onSubmit({
        type,
        body: body.trim(),
        title: title.trim() || undefined,
        authorName: useIdentity && authorName.trim() ? authorName.trim() : undefined,
        websiteUrl: useIdentity && websiteUrl.trim() ? websiteUrl.trim() : undefined,
        space,
        polaroidFile,
        audioFile: audioFile ?? undefined,
      });
    } catch {
      toast.error('Something went wrong. Try again.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 glass-strong rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg mx-0 sm:mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            {/* Type toggle pill */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
              {(['thought', 'dream'] as MomentType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={type === t
                    ? { background: t === 'dream' ? '#c4b5fd22' : '#fbbf2422', color: t === 'dream' ? '#c4b5fd' : '#fbbf24', border: `1px solid ${t === 'dream' ? '#c4b5fd40' : '#fbbf2440'}` }
                    : { color: 'rgba(255,255,255,0.38)' }
                  }
                >
                  {t === 'dream' ? 'Dream' : 'Thought'}
                </button>
              ))}
            </div>

            {/* Space selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpaceMenu(v => !v)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide text-white/45 hover:text-white/72 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {spaceLabel.toUpperCase()}
                <ChevronDown size={10} />
              </button>
              {showSpaceMenu && (
                <div className="absolute left-0 top-8 z-20 rounded-xl shadow-2xl overflow-hidden"
                  style={{ background: 'rgba(12,12,24,0.97)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 140 }}>
                  {SPACES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSpace(s.id); setShowSpaceMenu(false); }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-[11px] tracking-widest uppercase font-semibold transition-colors',
                        space === s.id ? 'text-white' : 'text-white/45 hover:text-white/72'
                      )}
                      style={space === s.id ? { background: 'rgba(255,255,255,0.08)' } : {}}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button onClick={onClose}
            className="p-2 rounded-full text-white/38 hover:text-white/75 hover:bg-white/9 transition-colors" aria-label="Close">
            <X size={17} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[72vh] px-6 py-5 space-y-4">

          {/* Identity row */}
          <div className="flex items-center gap-3">
            {userAvatar && (
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/14 flex-shrink-0">
                <img src={userAvatar} alt="" className="w-full h-full object-cover" draggable={false} />
              </div>
            )}
            <div className="flex-1 flex items-center gap-2">
              <button
                onClick={() => setUseIdentity(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 text-xs transition-colors rounded-full px-3 py-1',
                  useIdentity ? 'text-white/72' : 'text-white/32 hover:text-white/55'
                )}
                style={useIdentity ? { background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)' } : {}}
              >
                <User size={11} />
                {useIdentity ? 'Publishing as:' : 'Pass anonymously'}
              </button>
            </div>
          </div>

          {/* Identity fields */}
          {useIdentity && (
            <div className="space-y-2 pl-11">
              <input
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="Your name or pen name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#f0ebe0] placeholder-white/25 outline-none focus:border-white/25 transition-colors"
              />
              <div className="relative">
                <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/28 pointer-events-none" />
                <input
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="website.com (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-[#f0ebe0] placeholder-white/25 outline-none focus:border-white/25 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 120))}
            placeholder="Title (optional)"
            className="w-full bg-transparent border-b border-white/10 pb-2 text-base font-semibold text-[#f0ebe0] placeholder-white/22 outline-none focus:border-white/28 transition-colors"
            style={{ fontFamily: isDream ? '"Playfair Display",Georgia,serif' : 'Inter,system-ui,sans-serif' }}
          />

          {/* Polaroid — above text */}
          {preview && (
            <div className="relative w-full rounded-xl overflow-hidden bg-black/20">
              <img src={preview} className="w-full max-h-56 object-cover" alt="" />
              <button
                onClick={removePolaroid}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/60 text-white/75 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Body — markdown-aware textarea */}
          <div>
            <textarea
              value={body}
              onChange={handleBodyChange}
              placeholder={isDream
                ? 'What did you dream?'
                : "What's passing through your mind? (markdown supported)"}
              autoFocus
              rows={5}
              className="w-full bg-transparent text-[#f0ebe0] placeholder-white/22 resize-none outline-none leading-relaxed"
              style={{
                fontSize: '1rem',
                fontFamily: isDream ? '"Playfair Display",Georgia,serif' : 'Inter,system-ui,sans-serif',
                minHeight: 120,
              }}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-white/22">markdown supported</span>
              {(nearLimit || overLimit) && (
                <span className={cn('text-xs transition-colors', overLimit ? 'text-red-400' : 'text-white/38')}>
                  {remaining} words left
                </span>
              )}
              {!nearLimit && (
                <span className="text-[10px] text-white/22">{words} / {MAX_WORDS} words</span>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="pt-3 border-t border-white/8 space-y-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
            {!preview && (
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-sm text-white/38 hover:text-white/65 transition-colors">
                <Image size={15} /><span>Add a photo</span>
              </button>
            )}
            <AudioRecorder audioFile={audioFile} onFile={setAudioFile} typeColor={typeColor} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/8">
          <span className="text-[11px] text-white/25 font-mono">{spaceLabel.toUpperCase()}</span>
          <button
            onClick={submit}
            disabled={!canPost || busy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-25"
            style={{ background: canPost ? `${typeColor}18` : 'transparent', color: typeColor, border: `1px solid ${typeColor}38` }}
          >
            {busy
              ? <span className="flex items-center gap-2"><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />Letting go…</span>
              : <><span>Let it go</span><ArrowRight size={13} /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
