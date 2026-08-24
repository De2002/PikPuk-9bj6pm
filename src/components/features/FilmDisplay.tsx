import { useEffect, useState } from 'react';
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
  neighbours: [Moment | null, Moment | null];
}

const SIZES: Record<TextSize, string> = {
  sm: 'text-sm leading-relaxed',
  md: 'text-base leading-relaxed',
  lg: 'text-lg leading-loose',
};

interface SprocketProps {
  side: 'left' | 'right';
  neighbour: Moment | null;
  progress: number;
}

function SprocketStrip({ side, neighbour, progress }: SprocketProps) {
  const HOLES = 9;
  const avatarHoleIdx = side === 'left'
    ? Math.round((1 - progress) * (HOLES - 1))
    : Math.round(progress * (HOLES - 1));

  return (
    <div className="absolute top-0 bottom-0 flex flex-col justify-around items-center py-2"
      style={{ [side]: 0, width: 30, background: 'rgba(0,0,0,0.75)', zIndex: 1 }}>
      {Array.from({ length: HOLES }).map((_, i) => {
        const isAvatar = neighbour && i === avatarHoleIdx;
        return (
          <div key={i} className="relative flex items-center justify-center" style={{ width: 18, height: 18 }}>
            {isAvatar ? (
              <div className="rounded-full overflow-hidden ring-1 ring-white/20 bg-white/10 transition-all duration-700"
                style={{ width: 16, height: 16 }}>
                <img src={neighbour!.avatarUrl} alt="" className="w-full h-full object-cover" draggable={false}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
              </div>
            ) : (
              <div className="rounded-sm"
                style={{ width: 11, height: 11, background: 'rgba(0,0,0,0.85)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GhostFrame({ moment, position }: { moment: Moment | null; position: 'prev' | 'next' }) {
  if (!moment) return null;
  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const tx = position === 'prev' ? '-80%' : '80%';
  const ry = position === 'prev' ? '26deg' : '-26deg';

  return (
    <div className="absolute top-1/2 w-full max-w-[480px]"
      style={{ transform: `translateX(${tx}) translateY(-50%) rotateY(${ry}) scale(0.70)`, transformOrigin: position === 'prev' ? 'right center' : 'left center', opacity: 0.2, filter: 'blur(3px)', pointerEvents: 'none' }}>
      <div className="rounded-xl" style={{ background: 'rgba(8,8,18,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="relative flex">
          <div className="w-7 flex flex-col justify-around items-center py-2 bg-black/60" style={{ minHeight: 80 }}>
            {[0,1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-sm" style={{ background: 'rgba(0,0,0,0.85)' }} />)}
          </div>
          <div className="flex-1 px-4 py-4">
            <span className="text-[9px] tracking-[0.2em] uppercase font-semibold block mb-1.5" style={{ color: typeColor, opacity: 0.6 }}>{moment.type}</span>
            {moment.title && <p className="text-[#f0ebe0] text-xs font-semibold mb-1 line-clamp-1">{moment.title}</p>}
            <p className="text-[#f0ebe0] text-xs leading-snug line-clamp-2">{moment.body}</p>
          </div>
          <div className="w-7 flex flex-col justify-around items-center py-2 bg-black/60">
            {[0,1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-sm" style={{ background: 'rgba(0,0,0,0.85)' }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FilmDisplay({
  moment, phase, textSize = 'md', isPinned,
  onPass, onPin, onLetGo, neighbours,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const readDur = calcReadingTime(moment.body);
  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const bodyFont = isDream ? '"Playfair Display", Georgia, serif' : 'Inter, system-ui, sans-serif';
  const spaceLabel = SPACES.find(s => s.id === moment.space)?.label ?? '';
  const [prev, next] = neighbours;

  useEffect(() => {
    let rafId: number;
    let startTime: number | null = null;
    let animating = false;

    if (phase === 'entering') {
      setVisible(false); setProgress(0);
      const id = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(id);
    }
    if (phase === 'reading') {
      setVisible(true); setProgress(0);
      animating = true;
      const animate = (ts: number) => {
        if (!animating) return;
        if (startTime === null) startTime = ts;
        const p = Math.min((ts - startTime) / readDur, 1);
        setProgress(p);
        if (p < 1) rafId = requestAnimationFrame(animate);
      };
      rafId = requestAnimationFrame(animate);
      return () => { animating = false; cancelAnimationFrame(rafId); };
    }
    if (phase === 'leaving') { setVisible(false); setProgress(1); }
  }, [phase, readDur]);

  const frameStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0) scale(1)' : phase === 'leaving' ? 'translateY(-18px) scale(0.97)' : 'translateY(20px) scale(0.97)',
    transition: phase === 'entering' ? 'opacity 750ms cubic-bezier(0.22,1,0.36,1), transform 750ms cubic-bezier(0.22,1,0.36,1)' : phase === 'leaving' ? 'opacity 660ms ease, transform 660ms ease' : 'opacity 200ms ease',
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10, perspective: '1200px' }}>
      {visible && <GhostFrame moment={prev} position="prev" />}
      {visible && <GhostFrame moment={next} position="next" />}

      <div className="relative w-full max-w-[520px] pointer-events-auto px-3 sm:px-0" style={frameStyle}>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'rgba(8,8,18,0.90)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)' }}>
          <SprocketStrip side="left"  neighbour={next} progress={progress} />
          <SprocketStrip side="right" neighbour={prev} progress={progress} />

          <div className="px-11 py-6 sm:px-12 sm:py-7">
            {/* Author row */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/15 bg-white/8 flex-shrink-0">
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
              <div className="w-full rounded-lg overflow-hidden mb-3 bg-black/20">
                <img src={moment.polaroidUrl} alt="" className="w-full object-cover max-h-40" draggable={false} />
              </div>
            )}

            {/* Title */}
            {moment.title && (
              <p className="text-sm font-semibold text-[#f0ebe0] mb-1.5 leading-snug"
                style={{ fontFamily: isDream ? '"Playfair Display",Georgia,serif' : 'Inter,system-ui,sans-serif' }}>
                {moment.title}
              </p>
            )}

            {/* Body */}
            <p className={`${SIZES[textSize]} text-[#f0ebe0]/88`} style={{ fontFamily: bodyFont }}>
              {moment.body}
            </p>

            {/* Film indicator */}
            <div className="mt-4 flex items-center justify-center gap-2 opacity-20">
              <div className="flex-1 h-px rounded" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3))' }} />
              <div className="flex gap-1">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="rounded-full transition-all duration-300"
                    style={{ width: i === 2 ? 20 : 5, height: 5, background: i === 2 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }} />
                ))}
              </div>
              <div className="flex-1 h-px rounded" style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.3))' }} />
            </div>

            {/* Pin / Pass */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/8">
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
        </div>

        {isPinned && (
          <div className="text-center mt-3 opacity-28">
            <span className="text-[10px] tracking-[0.25em] uppercase text-white/45">Pinned</span>
          </div>
        )}
      </div>
    </div>
  );
}
