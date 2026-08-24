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

function SideCard({ moment, position }: { moment: Moment | null; position: 'left' | 'right' }) {
  if (!moment) return null;
  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const tx = position === 'left' ? '-62%' : '62%';
  const ry = position === 'left' ? '52deg' : '-52deg';
  const to = position === 'left' ? 'right center' : 'left center';

  return (
    <div className="absolute top-1/2 w-full max-w-[420px]"
      style={{ transform: `translateX(${tx}) translateY(-50%) rotateY(${ry}) scale(0.68)`, transformOrigin: to, opacity: 0.18, filter: 'blur(4px) brightness(0.6)', pointerEvents: 'none', zIndex: 0 }}>
      <div className="rounded-2xl px-6 py-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <span className="text-[9px] tracking-[0.2em] uppercase font-semibold block mb-1" style={{ color: typeColor, opacity: 0.5 }}>{moment.type}</span>
        {moment.title && <p className="text-[#f0ebe0] text-xs font-semibold mb-1 line-clamp-1">{moment.title}</p>}
        <p className="text-[#f0ebe0] text-xs leading-snug line-clamp-3">{moment.body}</p>
      </div>
    </div>
  );
}

export default function CarouselDisplay({ moment, phase, textSize = 'md', isPinned, onPass, onPin, onLetGo, neighbours }: Props) {
  const [visible, setVisible] = useState(false);
  const readDur = calcReadingTime(moment.body);
  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const bodyFont = isDream ? '"Playfair Display", Georgia, serif' : 'Inter, system-ui, sans-serif';
  const spaceLabel = SPACES.find(s => s.id === moment.space)?.label ?? '';

  useEffect(() => {
    if (phase === 'entering') { setVisible(false); const id = setTimeout(() => setVisible(true), 30); return () => clearTimeout(id); }
    if (phase === 'leaving') setVisible(false);
    if (phase === 'reading') setVisible(true);
  }, [phase]);

  const mainStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(-50%) rotateY(0deg) scale(1)' : phase === 'leaving' ? 'translateY(-50%) rotateY(-8deg) scale(0.92)' : 'translateY(-50%) rotateY(8deg) scale(0.92)',
    transition: phase === 'entering' ? 'opacity 820ms cubic-bezier(0.22,1,0.36,1), transform 820ms cubic-bezier(0.22,1,0.36,1)' : phase === 'leaving' ? 'opacity 680ms ease, transform 680ms ease' : `opacity 200ms ease, transform ${readDur}ms linear`,
    zIndex: 2,
  };

  const [prev, next] = neighbours;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10, perspective: '1000px' }}>
      {visible && <SideCard moment={prev} position="left" />}
      {visible && <SideCard moment={next} position="right" />}

      <div className="absolute top-1/2 w-full max-w-[480px] px-5 pointer-events-auto" style={mainStyle}>
        <div className="rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.055)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)' }}>

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
              <div className="w-full rounded-lg overflow-hidden mb-3 bg-black/20">
                <img src={moment.polaroidUrl} alt="" className="w-full object-cover max-h-44" draggable={false} />
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
            <p className={`${SIZES[textSize]} text-[#f0ebe0]/88`} style={{ fontFamily: bodyFont }}>
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

        <div className="flex justify-center gap-2 mt-4">
          {[-1, 0, 1].map(i => (
            <div key={i} className="rounded-full transition-all"
              style={{ width: i === 0 ? 20 : 6, height: 6, background: i === 0 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
