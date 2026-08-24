
import { useEffect, useState, useRef } from 'react';
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
}

const SIZES: Record<TextSize, string> = {
  sm: 'text-base leading-relaxed',
  md: 'text-lg leading-relaxed',
  lg: 'text-xl leading-loose',
};

/**
 * Duster display — content is swept away by a chalk-board duster stroke,
 * revealing the next moment underneath.
 *
 * The "wipe" is a CSS clip-path that travels horizontally across the card,
 * with a blurry leading edge to simulate a soft eraser brush.
 */
export default function DusterDisplay({
  moment, phase, textSize = 'md', isPinned, enableVoiceAudio, autoPlayVoice,
  onReport, onPin, onLetGo,
}: Props) {
  const readDur = calcReadingTime(moment.body);
  const rotation = getPolaroidRotation(moment.id);
  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const bodyFont = isDream ? '"Playfair Display", Georgia, serif' : 'Inter, system-ui, sans-serif';

  // ── Clip-path wipe state ─────────────────────────────────────────────────
  // 'hidden'  : fully clipped (invisible)
  // 'entering': clip sweeps in left→right (reveal)
  // 'reading' : fully revealed
  // 'leaving' : clip sweeps out right→left (erase)
  type WipeState = 'hidden' | 'entering' | 'reading' | 'leaving';
  const [wipe, setWipe] = useState<WipeState>('hidden');
  // dustX: 0..100 — horizontal position of the duster leading edge
  const [dustX, setDustX] = useState(0);
  const rafRef = useRef<number>();
  const startRef = useRef<number | null>(null);

  const ENTER_MS = 780;
  const LEAVE_MS = 680;

  const animateDust = (
    duration: number,
    fromX: number,
    toX: number,
    onDone: () => void,
  ) => {
    startRef.current = null;
    cancelAnimationFrame(rafRef.current!);
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setDustX(fromX + (toX - fromX) * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else onDone();
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase === 'entering') {
      setWipe('hidden');
      setDustX(0);
      // short delay then sweep in
      const t = setTimeout(() => {
        setWipe('entering');
        animateDust(ENTER_MS, 0, 110, () => setWipe('reading'));
      }, 60);
      return () => clearTimeout(t);
    }
    if (phase === 'reading') {
      setWipe('reading');
      setDustX(110);
    }
    if (phase === 'leaving') {
      setWipe('leaving');
      // sweep out right→left
      animateDust(LEAVE_MS, 110, -10, () => setWipe('hidden'));
    }
    if (phase === 'gap') {
      setWipe('hidden');
      setDustX(0);
    }
  }, [phase, animateDust]); // Added `animateDust` to the dependency array

  // Build the clip-path polygon from dustX
  // During entering: content revealed left of dustX
  // During leaving: content remains right of dustX being erased from the left
  const clipPath = (() => {
    if (wipe === 'hidden') return 'inset(0 100% 0 0)';
    if (wipe === 'reading') return 'inset(0 0% 0 0)';
    if (wipe === 'entering') {
      // Reveal from left: visible region is 0 → dustX%
      const right = Math.max(0, 100 - dustX);
      return `inset(0 ${right}% 0 0)`;
    }
    // leaving: erase from left: visible region is dustX% → 100%
    const left = Math.max(0, dustX + 10);
    return `inset(0 0% 0 ${left}%)`;
  })();

  // Leading-edge "duster brush" overlay — soft blurry vertical band at dustX
  const showDuster = wipe === 'entering' || wipe === 'leaving';
  const dusterLeft = `${Math.min(Math.max(dustX - 8, -10), 100)}%`;

  const isVisible = wipe !== 'hidden';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none px-5 sm:px-8"
      style={{ zIndex: 10 }}
    >
      <div className="w-full max-w-[480px] pointer-events-auto relative">

        {/* ── Card with clip-path wipe ── */}
        <div style={{ position: 'relative', isolation: 'isolate' }}>

          {/* The actual card — clipped by wipe */}
          <div
            className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-9 shadow-2xl"
            style={{
              clipPath,
              WebkitClipPath: clipPath,
              transition: wipe === 'reading' ? 'clip-path 200ms ease' : 'none',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/14 bg-white/8">
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
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-white/35 hover:text-white/68 hover:bg-white/8 transition-all"
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
                  className="p-1.5 rounded-lg text-white/25 hover:text-white/65 hover:bg-white/8 transition-colors"
                  aria-label="More options"
                >
                  <MoreHorizontal size={15} />
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
                  filter: 'drop-shadow(0 5px 22px rgba(0,0,0,0.55))',
                }}
              >
                <div className="bg-white p-2.5" style={{ paddingBottom: '2rem' }}>
                  <img
                    src={moment.polaroidUrl}
                    alt=""
                    className="w-[148px] h-[148px] sm:w-[164px] sm:h-[164px] object-cover block"
                    draggable={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Duster brush edge ── */}
          {showDuster && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: -4,
                bottom: -4,
                left: dusterLeft,
                width: 48,
                pointerEvents: 'none',
                background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.09) 30%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.09) 70%, transparent 100%)',
                filter: 'blur(8px)',
                borderRadius: 8,
                zIndex: 5,
              }}
            />
          )}
        </div>

        {/* Pinned indicator */}
        {isPinned && isVisible && (
          <div className="text-center mt-3">
            <span className="text-[10px] tracking-[0.22em] uppercase text-white/32">
              Pinned — music plays on
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
