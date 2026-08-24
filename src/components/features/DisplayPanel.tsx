import { X } from 'lucide-react';
import { DisplayId } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  current: DisplayId;
  onSelect: (id: DisplayId) => void;
  onClose: () => void;
}

interface DisplayOption {
  id: DisplayId;
  label: string;
  description: string;
  preview: React.ReactNode;
}

function DusterPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <div className="relative w-32 h-10 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Content lines */}
        <div className="absolute inset-0 px-3 py-2 space-y-1.5">
          <div className="h-1 rounded bg-white/18 w-full" />
          <div className="h-1 rounded bg-white/12 w-4/5" />
          <div className="h-1 rounded bg-white/10 w-3/5" />
        </div>
        {/* Duster wipe — covers right half */}
        <div className="absolute top-0 right-0 bottom-0 w-1/2 rounded-r-xl" style={{ background: 'rgba(8,8,18,0.72)', borderLeft: '1px solid rgba(255,255,255,0.06)' }} />
        {/* Brush edge */}
        <div className="absolute top-0 bottom-0" style={{ left: '47%', width: 10, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent)', filter: 'blur(2px)' }} />
      </div>
    </div>
  );
}

function FloatPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <div className="w-24 h-9 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="h-full flex items-center px-2 gap-1.5">
          <div className="w-4 h-4 rounded-full bg-white/15 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-1 rounded bg-white/18 w-full" />
            <div className="h-1 rounded bg-white/10 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FilmPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center gap-1.5">
      {/* Ghost prev */}
      <div className="w-10 h-11 rounded opacity-25" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', transform: 'perspective(120px) rotateY(30deg) scale(0.82)' }}>
        <div className="flex h-full">
          <div className="w-2 flex flex-col justify-around items-center py-1">
            {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-sm bg-black/60" />)}
          </div>
          <div className="flex-1" />
          <div className="w-2 flex flex-col justify-around items-center py-1">
            {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-sm bg-black/60" />)}
          </div>
        </div>
      </div>
      {/* Main */}
      <div className="w-20 h-13 rounded-lg flex-shrink-0" style={{ background: 'rgba(8,8,18,0.88)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex h-full">
          <div className="w-2.5 flex flex-col justify-around items-center py-1 bg-black/40 rounded-l-lg">
            {[0,1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-sm bg-black/70" />)}
          </div>
          <div className="flex-1 flex items-center px-1.5">
            <div className="space-y-1 w-full">
              <div className="h-1 rounded bg-purple-300/30 w-2/3" />
              <div className="h-1 rounded bg-white/15 w-full" />
              <div className="h-1 rounded bg-white/10 w-4/5" />
            </div>
          </div>
          <div className="w-2.5 flex flex-col justify-around items-center py-1 bg-black/40 rounded-r-lg">
            {[0,1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-sm bg-black/70" />)}
          </div>
        </div>
      </div>
      {/* Ghost next */}
      <div className="w-10 h-11 rounded opacity-25" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', transform: 'perspective(120px) rotateY(-30deg) scale(0.82)' }}>
        <div className="flex h-full">
          <div className="w-2 flex flex-col justify-around items-center py-1">
            {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-sm bg-black/60" />)}
          </div>
          <div className="flex-1" />
          <div className="w-2 flex flex-col justify-around items-center py-1">
            {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-sm bg-black/60" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function CarouselPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center gap-1.5">
      <div className="w-10 h-11 rounded-lg opacity-20" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', transform: 'perspective(160px) rotateY(50deg) scale(0.72)', filter: 'blur(1.5px)' }}>
        <div className="p-1.5 space-y-1">
          <div className="h-1 rounded bg-white/20 w-3/4" />
          <div className="h-1 rounded bg-white/12" />
        </div>
      </div>
      <div className="w-24 h-13 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
        <div className="p-2 space-y-1">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-white/15" />
            <div className="h-1 rounded bg-amber-300/35 w-8" />
          </div>
          <div className="h-1 rounded bg-white/18 w-full" />
          <div className="h-1 rounded bg-white/10 w-4/5" />
        </div>
      </div>
      <div className="w-10 h-11 rounded-lg opacity-20" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', transform: 'perspective(160px) rotateY(-50deg) scale(0.72)', filter: 'blur(1.5px)' }}>
        <div className="p-1.5 space-y-1">
          <div className="h-1 rounded bg-white/20 w-3/4" />
          <div className="h-1 rounded bg-white/12" />
        </div>
      </div>
    </div>
  );
}

const OPTIONS: DisplayOption[] = [
  { id: 'float',    label: 'Float',    description: 'Moments drift gently past, centre-stage.',                  preview: <FloatPreview /> },
  { id: 'film',     label: 'Film',     description: 'A rolling film strip — profile pictures ride through the sprocket holes.', preview: <FilmPreview /> },
  { id: 'carousel', label: 'Carousel', description: 'A curved arc. One moment faces you; others wait their turn.', preview: <CarouselPreview /> },
  { id: 'duster',   label: 'Duster',   description: 'Each moment is swept away like chalk — the next revealed beneath.', preview: <DusterPreview /> },
];

export default function DisplayPanel({ current, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/58 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 glass-strong rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4">
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/7">
          <div>
            <h2 className="text-[#f0ebe0] font-medium tracking-wide">Display</h2>
            <p className="text-white/35 text-xs mt-0.5">How moments pass through your world</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-white/38 hover:text-white/72 hover:bg-white/8 transition-colors">
            <X size={17} />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onSelect(opt.id); onClose(); }}
              className={cn(
                'w-full text-left rounded-2xl border transition-all overflow-hidden',
                current === opt.id
                  ? 'border-white/22 bg-white/7'
                  : 'border-white/7 bg-white/2 hover:border-white/14 hover:bg-white/4'
              )}
            >
              <div className="px-4 pt-4 pb-2">
                {opt.preview}
              </div>
              <div className="px-4 pb-4 flex items-center justify-between">
                <div>
                  <p className={cn('text-sm font-medium', current === opt.id ? 'text-[#f0ebe0]' : 'text-white/62')}>{opt.label}</p>
                  <p className="text-white/35 text-xs mt-0.5 leading-snug">{opt.description}</p>
                </div>
                {current === opt.id && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-3" style={{ background: 'rgba(196,181,253,0.2)', border: '1px solid rgba(196,181,253,0.45)' }}>
                    <div className="w-2 h-2 rounded-full bg-purple-300" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 pt-1">
          <p className="text-white/22 text-[10px] text-center leading-relaxed">
            Same stream. Different ways to experience it.
          </p>
        </div>
      </div>
    </div>
  );
}
