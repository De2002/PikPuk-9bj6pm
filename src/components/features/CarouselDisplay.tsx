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

function SideCard({ moment, position }: { moment: Moment | null; position: 'left' | 'right' }) {
  if (!moment) return null;
  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const tx = position === 'left' ? '-62%' : '62%';
  const ry = position === 'left' ? '52deg' : '-52deg';
  const to = position === 'left' ? 'right center' : 'left center';

  return (
    <div className="absolute top-1/2 w-full max-w-[420px]"
      style={{
        transform: `translateX(${tx}) translateY(-50%) rotateY(${ry}) scale(0.68)`,
        transformOrigin: to,
        opacity: 0.18,
        filter: 'blur(4px) brightness(0.6)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <div className="rounded-2xl px-7 py-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <span className="text-[9px] tracking-[0.2em] uppercase font-semibold block mb-2" style={{ color: typeColor, opacity: 0.5 }}>{moment.type}</span>
        <p className="text-[#f0ebe0] text-xs leading-snug line-clamp-4">«{moment.body}»</p>
      </div>
    </div>
  );
}

export default function CarouselDisplay({ moment, phase, textSize = 'md', isPinned, enableVoiceAudio, autoPlayVoice, onReport, onPin, onLetGo, neighbours }: Props) {
  const [visible, setVisible] = useState(false);
  const readDur = calcReadingTime(moment.body);
  const rotation = getPolaroidRotation(moment.id);
  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const bodyFont = isDream ? '"Playfair Display", Georgia, serif' : 'Inter, system-ui, sans-serif';

  useEffect(() => {
    if (phase === 'entering') {
      setVisible(false);
      const id = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(id);
    }
    if (phase === 'leaving') setVisible(false);
    if (phase === 'reading') setVisible(true);
  }, [phase]);

  const mainStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible
      ? 'translateY(-50%) rotateY(0deg) scale(1)'
      : phase === 'leaving'
      ? 'translateY(-50%) rotateY(-8deg) scale(0.92)'
      : 'translateY(-50%) rotateY(8deg) scale(0.92)',
    transition: phase === 'entering'
      ? 'opacity 820ms cubic-bezier(0.22,1,0.36,1), transform 820ms cubic-bezier(0.22,1,0.36,1)'
      : phase === 'leaving'
      ? 'opacity 680ms ease, transform 680ms ease'
      : `opacity 200ms ease, transform ${readDur}ms linear`,
    zIndex: 2,
  };

  const [prev, next] = neighbours;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10, perspective: '1000px' }}
    >
      {/* Side cards */}
      {visible && <SideCard moment={prev} position="left" />}
      {visible && <SideCard moment={next} position="right" />}

      {/* Center card */}
      <div
        className="absolute top-1/2 w-full max-w-[480px] px-5 pointer-events-auto"
        style={mainStyle}
      >
        <div
          className="rounded-2xl sm:rounded-3xl shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.055)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          <div className="p-6 sm:p-9">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/14 bg-white/8 flex-shrink-0">
                  <img src={moment.avatarUrl} alt="A person" className="w-full h-full object-cover" draggable={false}
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
                </div>
                <span className="text-[10px] font-semibold tracking-[0.22em] uppercase" style={{ color: typeColor, fontFamily: 'Inter,system-ui,sans-serif' }}>
                  {moment.type}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!isPinned ? (
                  <button onClick={onPin}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-white/38 hover:text-white/72 hover:bg-white/8 transition-all"
                    title="Hold this moment">
                    <span>📌</span>
                    <span className="hidden sm:inline">Pin</span>
                  </button>
                ) : (
                  <button onClick={onLetGo}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all"
                    style={{ color: typeColor, background: `${typeColor}14`, border: `1px solid ${typeColor}30` }}>
                    <span>📌</span>
                    <span>Let go →</span>
                  </button>
                )}
                <button onClick={onReport}
                  className="p-1.5 rounded-lg text-white/22 hover:text-white/60 hover:bg-white/8 transition-colors"
                  aria-label="More options">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <p className={`${SIZES[textSize]} text-[#f0ebe0]`} style={{ fontFamily: bodyFont }}>
              «{moment.body}»
            </p>

            {/* Polaroid */}
            {moment.polaroidUrl && (
              <div className="mt-5 mx-auto w-fit" style={{
                transform: `rotate(${rotation}deg)`,
                filter: 'drop-shadow(0 5px 22px rgba(0,0,0,0.55))',
              }}>
                <div className="bg-white p-2.5" style={{ paddingBottom: '2rem' }}>
                  <img src={moment.polaroidUrl} alt="" className="w-[148px] h-[148px] sm:w-[164px] sm:h-[164px] object-cover block" draggable={false} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carousel dots */}
        <div className="flex justify-center gap-2 mt-4">
          {[-1, 0, 1].map(i => (
            <div key={i} className="rounded-full transition-all" style={{
              width: i === 0 ? 20 : 6,
              height: 6,
              background: i === 0 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.15)',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
