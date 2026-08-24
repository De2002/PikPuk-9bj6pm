
import { useEffect, useState, useRef, useCallback } from 'react';
import { Moment, StreamPhase, TextSize, SPACES } from '@/types';
import { calcReadingTime } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface Props {
  moment: Moment;
  phase: StreamPhase;
  textSize?: TextSize;
  isPinned: boolean;
  enableVoiceAudio: boolean;
  autoPlayVoice: boolean;
  onPass: () => void;
  onPin: () => void;
  onLetGo: () => void;
}

const SIZES: Record<TextSize, string> = {
  sm: 'text-base leading-relaxed',
  md: 'text-lg leading-relaxed',
  lg: 'text-xl leading-loose',
};

export default function DusterDisplay({
  moment, phase, textSize = 'md', isPinned,
  onPass, onPin, onLetGo,
}: Props) {
  const readDur = calcReadingTime(moment.body);
  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const bodyFont = isDream ? '"Playfair Display", Georgia, serif' : 'Inter, system-ui, sans-serif';
  const spaceLabel = SPACES.find(s => s.id === moment.space)?.label ?? '';

  type WipeState = 'hidden' | 'entering' | 'reading' | 'leaving';
  const [wipe, setWipe] = useState<WipeState>('hidden');
  const [dustX, setDustX] = useState(0);
  const rafRef = useRef<number>();
  const startRef = useRef<number | null>(null);

  const ENTER_MS = 780;
  const LEAVE_MS = 680;

  const animateDust = useCallback((duration: number, fromX: number, toX: number, onDone: () => void) => {
    startRef.current = null;
    cancelAnimationFrame(rafRef.current!);
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDustX(fromX + (toX - fromX) * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else onDone();
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => { return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }; }, []);

  useEffect(() => {
    if (phase === 'entering') {
      setWipe('hidden'); setDustX(0);
      const t = setTimeout(() => { setWipe('entering'); animateDust(ENTER_MS, 0, 110, () => setWipe('reading')); }, 60);
      return () => clearTimeout(t);
    }
    if (phase === 'reading') { setWipe('reading'); setDustX(110); }
    if (phase === 'leaving') { setWipe('leaving'); animateDust(LEAVE_MS, 110, -10, () => setWipe('hidden')); }
    if (phase === 'gap') { setWipe('hidden'); setDustX(0); }
  }, [phase, animateDust]);

  const clipPath = (() => {
    if (wipe === 'hidden') return 'inset(0 100% 0 0)';
    if (wipe === 'reading') return 'inset(0 0% 0 0)';
    if (wipe === 'entering') { const right = Math.max(0, 100 - dustX); return `inset(0 ${right}% 0 0)`; }
    const left = Math.max(0, dustX + 10); return `inset(0 0% 0 ${left}%)`;
  })();

  const showDuster = wipe === 'entering' || wipe === 'leaving';
  const dusterLeft = `${Math.min(Math.max(dustX - 8, -10), 100)}%`;
  const isVisible = wipe !== 'hidden';

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4 sm:px-8" style={{ zIndex: 10 }}>
      <div className="w-full max-w-[500px] pointer-events-auto relative">
        <div style={{ position: 'relative', isolation: 'isolate' }}>
          <div className="glass rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
            style={{ clipPath, WebkitClipPath: clipPath, transition: wipe === 'reading' ? 'clip-path 200ms ease' : 'none' }}>

            <div className="p-6 sm:p-8">
              {/* Author */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/14 bg-white/8 flex-shrink-0">
                  <img src={moment.avatarUrl} alt="" className="w-full h-full object-cover" draggable={false}
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {moment.authorName
                      ? <span className="text-xs font-medium text-[#f0ebe0]/85 truncate">{moment.authorName}</span>
                      : <span className="text-[10px] text-white/28 italic">anonymous</span>
                    }
                    {moment.websiteUrl && (
                      <a href={moment.websiteUrl.startsWith('http') ? moment.websiteUrl : `https://${moment.websiteUrl}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-[10px] text-white/32 hover:text-white/55 transition-colors"
                        onClick={e => e.stopPropagation()}>
                        <ExternalLink size={9} />
                        <span className="truncate max-w-[100px]">{moment.websiteUrl.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: typeColor }}>{moment.type}</span>
                    {moment.space !== 'general' && (
                      <span className="text-[9px] tracking-[0.18em] uppercase font-semibold text-white/32">{spaceLabel}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo */}
              {moment.polaroidUrl && (
                <div className="w-full rounded-lg overflow-hidden mb-4 bg-black/20">
                  <img src={moment.polaroidUrl} alt="" className="w-full object-cover max-h-48" draggable={false} />
                </div>
              )}

              {/* Title */}
              {moment.title && (
                <p className="text-base font-semibold text-[#f0ebe0] mb-2 leading-snug"
                  style={{ fontFamily: isDream ? '"Playfair Display",Georgia,serif' : 'Inter,system-ui,sans-serif' }}>
                  {moment.title}
                </p>
              )}

              {/* Body */}
              <p className={`${SIZES[textSize]} text-[#f0ebe0]/88 mb-1`} style={{ fontFamily: bodyFont }}>
                {moment.body}
              </p>
            </div>

            {/* Pin / Pass */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-white/7">
              {!isPinned ? (
                <button onClick={onPin} className="flex items-center gap-1.5 text-[11px] text-white/32 hover:text-white/60 transition-colors">
                  <span>📌</span><span>Pin</span>
                </button>
              ) : (
                <button onClick={onLetGo} className="flex items-center gap-1.5 text-[11px] transition-all" style={{ color: typeColor }}>
                  <span>📌</span><span>Let go →</span>
                </button>
              )}
              <button onClick={onPass} className="text-[11px] text-white/28 hover:text-white/55 transition-colors">
                Pass →
              </button>
            </div>
          </div>

          {showDuster && (
            <div aria-hidden style={{ position: 'absolute', top: -4, bottom: -4, left: dusterLeft, width: 48, pointerEvents: 'none', background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.09) 30%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.09) 70%, transparent 100%)', filter: 'blur(8px)', borderRadius: 8, zIndex: 5 }} />
          )}
        </div>

        {isPinned && isVisible && (
          <div className="text-center mt-3">
            <span className="text-[10px] tracking-[0.22em] uppercase text-white/28">Pinned · music plays on</span>
          </div>
        )}
      </div>
    </div>
  );
}
