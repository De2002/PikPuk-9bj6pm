import { useEffect, useState } from 'react';
import { Moment, StreamPhase, TextSize } from '@/types';
import { getPolaroidRotation, calcReadingTime } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';

interface Props {
  moment: Moment;
  phase: StreamPhase;
  textSize?: TextSize;
  isPinned: boolean;
  enableVoiceAudio: boolean;
  autoPlayVoice: boolean;
  onReport: () => void;
  onPin: () => void;
  onLetGo: () => void;
  neighbours: [Moment | null, Moment | null];
}

const SIZES: Record<TextSize, string> = {
  sm: 'text-sm leading-relaxed',
  md: 'text-base leading-relaxed',
  lg: 'text-lg leading-loose',
};

// ── Sprocket strip with passing profile pictures ──────────────────────────────
interface SprocketProps {
  side: 'left' | 'right';
  /** The neighbour moment whose avatar rides through this strip */
  neighbour: Moment | null;
  /** How far along the film is (0 = just arrived, 1 = just left) */
  progress: number;
}

function SprocketStrip({ side, neighbour, progress }: SprocketProps) {
  const HOLES = 9;
  // Avatar sits in hole index 0..8 based on progress
  // Left strip (incoming): avatar travels top→bottom as moment approaches (progress 0→0.5)
  // Right strip (departing): avatar travels top→bottom as moment leaves (progress 0.5→1)
  const avatarHoleIdx = side === 'left'
    ? Math.round((1 - progress) * (HOLES - 1))   // top=distant, bottom=arriving
    : Math.round(progress * (HOLES - 1));          // top=just-left, bottom=long-gone

  return (
    <div
      className="absolute top-0 bottom-0 flex flex-col justify-around items-center py-2"
      style={{
        [side]: 0,
        width: 30,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 1,
      }}
    >
      {Array.from({ length: HOLES }).map((_, i) => {
        const isAvatar = neighbour && i === avatarHoleIdx;
        return (
          <div
            key={i}
            className="relative flex items-center justify-center"
            style={{ width: 18, height: 18 }}
          >
            {isAvatar ? (
              /* Profile picture riding through the sprocket hole */
              <div
                className="rounded-full overflow-hidden ring-1 ring-white/20 bg-white/10 transition-all duration-700"
                style={{ width: 16, height: 16 }}
                title="Upcoming moment"
              >
                <img
                  src={neighbour!.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                />
              </div>
            ) : (
              /* Standard rectangular sprocket hole */
              <div
                className="rounded-sm"
                style={{
                  width: 11,
                  height: 11,
                  background: 'rgba(0,0,0,0.85)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                }}
              />
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
    <div
      className="absolute top-1/2 w-full max-w-[480px]"
      style={{
        transform: `translateX(${tx}) translateY(-50%) rotateY(${ry}) scale(0.70)`,
        transformOrigin: position === 'prev' ? 'right center' : 'left center',
        opacity: 0.2,
        filter: 'blur(3px)',
        pointerEvents: 'none',
      }}
    >
      <div
        className="rounded-xl"
        style={{
          background: 'rgba(8,8,18,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Ghost sprockets */}
        <div className="relative flex">
          <div className="w-7 flex flex-col justify-around items-center py-2 bg-black/60" style={{ minHeight: 80 }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="w-2 h-2 rounded-sm" style={{ background: 'rgba(0,0,0,0.85)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }} />
            ))}
          </div>
          <div className="flex-1 px-4 py-4">
            <span className="text-[9px] tracking-[0.2em] uppercase font-semibold block mb-1.5" style={{ color: typeColor, opacity: 0.6 }}>
              {moment.type}
            </span>
            <p className="text-[#f0ebe0] text-xs leading-snug line-clamp-3">«{moment.body}»</p>
          </div>
          <div className="w-7 flex flex-col justify-around items-center py-2 bg-black/60">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-2 h-2 rounded-sm" style={{ background: 'rgba(0,0,0,0.85)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FilmDisplay({
  moment, phase, textSize = 'md', isPinned,
  enableVoiceAudio, autoPlayVoice, onReport, onPin, onLetGo, neighbours,
}: Props) {
  const [visible, setVisible] = useState(false);
  // progress: 0 = just entering, 0.5 = mid-read, 1 = leaving
  const [progress, setProgress] = useState(0);
  const readDur = calcReadingTime(moment.body);
  const rotation = getPolaroidRotation(moment.id);
  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const bodyFont = isDream ? '"Playfair Display", Georgia, serif' : 'Inter, system-ui, sans-serif';

  const [prev, next] = neighbours;

  useEffect(() => {
    let rafId: number;
    let startTime: number | null = null;
    let animating = false;

    if (phase === 'entering') {
      setVisible(false);
      setProgress(0);
      const id = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(id);
    }
    if (phase === 'reading') {
      setVisible(true);
      setProgress(0);
      // Slowly animate progress 0→1 over readDur
      animating = true;
      const animate = (ts: number) => {
        if (!animating) return;
        if (startTime === null) startTime = ts;
        const elapsed = ts - startTime;
        const p = Math.min(elapsed / readDur, 1);
        setProgress(p);
        if (p < 1) rafId = requestAnimationFrame(animate);
      };
      rafId = requestAnimationFrame(animate);
      return () => { animating = false; cancelAnimationFrame(rafId); };
    }
    if (phase === 'leaving') {
      setVisible(false);
      setProgress(1);
    }
  }, [phase, readDur]);

  const frameStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible
      ? 'translateY(0) scale(1)'
      : phase === 'leaving'
      ? 'translateY(-18px) scale(0.97)'
      : 'translateY(20px) scale(0.97)',
    transition: phase === 'entering'
      ? 'opacity 750ms cubic-bezier(0.22,1,0.36,1), transform 750ms cubic-bezier(0.22,1,0.36,1)'
      : phase === 'leaving'
      ? 'opacity 660ms ease, transform 660ms ease'
      : 'opacity 200ms ease',
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10, perspective: '1200px' }}
    >
      {/* Ghost frames */}
      {visible && <GhostFrame moment={prev} position="prev" />}
      {visible && <GhostFrame moment={next} position="next" />}

      {/* Main film frame */}
      <div className="relative w-full max-w-[520px] pointer-events-auto px-3 sm:px-0" style={frameStyle}>
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(8,8,18,0.90)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Sprocket strips with avatar riders */}
          <SprocketStrip side="left"  neighbour={next} progress={progress} />
          <SprocketStrip side="right" neighbour={prev} progress={progress} />

          {/* Content area */}
          <div className="px-11 py-7 sm:px-12 sm:py-9">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/15 bg-white/8 flex-shrink-0">
                  <img
                    src={moment.avatarUrl}
                    alt="A person"
                    className="w-full h-full object-cover"
                    draggable={false}
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                  />
                </div>
                <span
                  className="text-[10px] font-semibold tracking-[0.22em] uppercase"
                  style={{ color: typeColor, fontFamily: 'Inter,system-ui,sans-serif' }}
                >
                  {moment.type}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!isPinned ? (
                  <button
                    onClick={onPin}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-white/38 hover:text-white/72 hover:bg-white/8 transition-all"
                    title="Hold this moment"
                  >
                    <span>📌</span>
                    <span className="hidden sm:inline">Pin</span>
                  </button>
                ) : (
                  <button
                    onClick={onLetGo}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all"
                    style={{ color: typeColor, background: `${typeColor}14`, border: `1px solid ${typeColor}30` }}
                  >
                    <span>📌</span>
                    <span>Let go →</span>
                  </button>
                )}
                <button
                  onClick={onReport}
                  className="p-1.5 rounded-lg text-white/22 hover:text-white/60 hover:bg-white/8 transition-colors"
                  aria-label="More options"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <p
              className={`${SIZES[textSize]} text-[#f0ebe0] mb-1`}
              style={{ fontFamily: bodyFont }}
            >
              «{moment.body}»
            </p>

            {/* Polaroid */}
            {moment.polaroidUrl && (
              <div
                className="mt-5 mx-auto w-fit"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.6))',
                }}
              >
                <div className="bg-white p-2.5" style={{ paddingBottom: '2rem' }}>
                  <img
                    src={moment.polaroidUrl}
                    alt=""
                    className="w-[136px] h-[136px] sm:w-[152px] sm:h-[152px] object-cover block"
                    draggable={false}
                  />
                </div>
              </div>
            )}

            {/* Film advance indicator — dots + progress */}
            <div className="mt-5 flex items-center justify-center gap-2 opacity-25">
              <div className="flex-1 h-px rounded" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3))' }} />
              <div className="flex gap-1">
                {[0,1,2,3,4].map(i => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === 2 ? 20 : 5,
                      height: 5,
                      background: i === 2 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
                    }}
                  />
                ))}
              </div>
              <div className="flex-1 h-px rounded" style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.3))' }} />
            </div>
          </div>
        </div>

        {/* Status label below frame */}
        <div className="text-center mt-3 opacity-28">
          {isPinned
            ? <span className="text-[10px] tracking-[0.25em] uppercase text-white/45">Pinned — tap Let go to continue</span>
            : <span className="text-[10px] tracking-[0.25em] uppercase text-white/30">Film advancing</span>
          }
        </div>
      </div>
    </div>
  );
}
