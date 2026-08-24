import { X, Moon, Waves, TreePine, Flame, CloudRain, Sunrise, Cloud, Building2, Music, VolumeX } from 'lucide-react';
import { Atmosphere, AtmosphereId, AudioMode } from '@/types';
import { ATMOSPHERES } from '@/constants/atmospheres';
import { cn } from '@/lib/utils';

interface Props {
  current: Atmosphere;
  onSelect: (id: AtmosphereId) => void;
  onClose: () => void;
  isPlaying: boolean;
  onToggleAudio: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
}

const ICONS: Record<AtmosphereId, React.ReactNode> = {
  night: <Moon size={16} />, ocean: <Waves size={16} />, forest: <TreePine size={16} />,
  fire: <Flame size={16} />, rain: <CloudRain size={16} />, dawn: <Sunrise size={16} />,
  clouds: <Cloud size={16} />, city: <Building2 size={16} />,
};

const AUDIO_NAMES: Record<AudioMode, string> = {
  calm: 'Calm', rain: 'Rain', night: 'Night', nature: 'Nature',
  piano: 'Piano', hopeful: 'Hopeful', none: 'Off',
};

export default function AtmospherePanel({ current, onSelect, onClose, isPlaying, onToggleAudio, volume, onVolumeChange }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/58 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 glass-strong rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4">
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/7">
          <h2 className="text-[#f0ebe0] font-medium tracking-wide">Atmosphere</h2>
          <button onClick={onClose} className="p-2 rounded-full text-white/38 hover:text-white/72 hover:bg-white/8 transition-colors">
            <X size={17} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Background grid */}
          <div>
            <p className="text-white/38 text-[10px] uppercase tracking-[0.2em] mb-3">Background</p>
            <div className="grid grid-cols-4 gap-2">
              {ATMOSPHERES.map(atm => (
                <button key={atm.id} onClick={() => onSelect(atm.id)}
                  className={cn('flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl text-[11px] transition-all',
                    current.id === atm.id
                      ? 'bg-white/11 text-[#f0ebe0] border border-white/18'
                      : 'text-white/42 border border-white/6 hover:text-white/68 hover:bg-white/5')}>
                  {ICONS[atm.id]}
                  <span className="leading-tight text-center">{atm.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audio */}
          <div>
            <p className="text-white/38 text-[10px] uppercase tracking-[0.2em] mb-3">Sound</p>
            <button onClick={onToggleAudio}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all mb-4',
                isPlaying ? 'bg-white/11 text-[#f0ebe0] border border-white/18' : 'text-white/42 border border-white/8 hover:text-white/62')}>
              {isPlaying ? <Music size={14} /> : <VolumeX size={14} />}
              {isPlaying ? `${AUDIO_NAMES[current.audioMode]} — playing` : 'Audio off'}
            </button>

            <div className="flex items-center gap-3">
              <span className="text-white/28 text-xs w-12">Volume</span>
              <input type="range" min={0} max={1} step={0.01} value={volume}
                onChange={e => onVolumeChange(parseFloat(e.target.value))}
                className="flex-1 cursor-pointer"
                style={{ background: `linear-gradient(to right,rgba(196,181,253,0.55) ${volume*100}%,rgba(255,255,255,0.09) ${volume*100}%)` }}
              />
              <span className="text-white/28 text-xs w-8 text-right">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
