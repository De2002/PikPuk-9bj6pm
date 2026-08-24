
import { useEffect, useState, useRef, useCallback } from 'react';
import { Moment, StreamPhase, TextSize } from '@/types';
import { getPolaroidRotation, calcReadingTime } from '@/lib/utils';
import { audioEngine } from '@/lib/audioEngine';
import { MoreHorizontal, Play, Pause } from 'lucide-react';

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
  /** Called once with the voice note duration (seconds) so Stream can use it as reading time */
  onAudioDuration?: (seconds: number) => void;
}

type CardPhase = 'hidden' | StreamPhase;

function buildStyle(p: CardPhase, readDur: number): React.CSSProperties {
  if (p === 'hidden' || p === 'gap') return {
    opacity: 0, transform: 'translateY(32px)', transition: 'none',
  };
  if (p === 'entering') return {
    opacity: 1, transform: 'translateY(0px)',
    transition: 'opacity 820ms cubic-bezier(0.22,1,0.36,1), transform 820ms cubic-bezier(0.22,1,0.36,1)',
  };
  if (p === 'reading') return {
    opacity: 1, transform: 'translateY(-16px)',
    transition: `opacity 300ms ease, transform ${readDur}ms linear`,
  };
  return {
    opacity: 0, transform: 'translateY(-44px)',
    transition: 'opacity 720ms ease, transform 720ms ease',
  };
}

const SIZES: Record<TextSize, string> = {
  sm: 'text-base leading-relaxed',
  md: 'text-lg leading-relaxed',
  lg: 'text-xl leading-loose',
};

/** Avatar with optional audio-playing wave rings */
function AvatarWithAudio({
  avatarUrl, isPlaying, hasAudio, typeColor, onClick,
}: {
  avatarUrl: string;
  isPlaying: boolean;
  hasAudio: boolean;
  typeColor: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hasAudio}
      className="relative flex-shrink-0 focus:outline-none"
      style={{ cursor: hasAudio ? 'pointer' : 'default' }}
      title={hasAudio ? (isPlaying ? 'Pause voice note' : 'Play voice note') : undefined}
      aria-label={hasAudio ? (isPlaying ? 'Pause voice note' : 'Play voice note') : 'Profile picture'}
    >
      {/* Ripple rings when playing */}
      {isPlaying && (
        <>
          <span className="absolute inset-0 rounded-full pointer-events-none" style={{
            border: `1.5px solid ${typeColor}`,
            animationName: 'voiceRipple',
            animationDuration: '1.4s',
            animationTimingFunction: 'ease-out',
            animationIterationCount: 'infinite',
            animationDelay: '0s',
          }} />
          <span className="absolute inset-0 rounded-full pointer-events-none" style={{
            border: `1.5px solid ${typeColor}`,
            animationName: 'voiceRipple',
            animationDuration: '1.4s',
            animationTimingFunction: 'ease-out',
            animationIterationCount: 'infinite',
            animationDelay: '0.45s',
          }} />
          <span className="absolute inset-0 rounded-full pointer-events-none" style={{
            border: `1.5px solid ${typeColor}`,
            animationName: 'voiceRipple',
            animationDuration: '1.4s',
            animationTimingFunction: 'ease-out',
            animationIterationCount: 'infinite',
            animationDelay: '0.9s',
          }} />
        </>
      )}

      {/* Avatar circle */}
      <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/14 bg-white/8 relative">
        <img src={avatarUrl} alt="A person" className="w-full h-full object-cover"
          draggable={false}
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
        {/* Play/pause overlay icon when there's audio */}
        {hasAudio && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full transition-opacity"
            style={{
              background: 'rgba(0,0,0,0.45)',
              opacity: isPlaying ? 1 : 0,
            }}>
            {isPlaying
              ? <Pause size={11} fill="white" className="text-white" />
              : <Play size={11} fill="white" className="text-white" />
            }
          </div>
        )}
      </div>

      {/* Tiny speaker dot indicator */}
      {hasAudio && !isPlaying && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
          style={{ background: typeColor, border: '1.5px solid rgba(8,8,20,0.9)' }}>
          <Play size={6} fill="rgba(8,8,20,0.9)" className="text-[rgba(8,8,20,0.9)] ml-[1px]" />
        </span>
      )}
    </button>
  );
}

export default function StreamCard({
  moment, phase, textSize = 'md', isPinned, enableVoiceAudio, autoPlayVoice,
  onReport, onPin, onLetGo, onAudioDuration,
}: Props) {
  const [cardPhase, setCardPhase] = useState<CardPhase>('hidden');
  const [voicePlaying, setVoicePlaying] = useState(false);
  const voiceElRef = useRef<HTMLAudioElement | null>(null);
  const readDur = calcReadingTime(moment.body);
  const rotation = getPolaroidRotation(moment.id);
  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const bodyFont = isDream ? '"Playfair Display", Georgia, serif' : 'Inter, system-ui, sans-serif';
  const hasAudio = !!moment.audioUrl && enableVoiceAudio;

  // ── Voice audio element ──────────────────────────────────────────────────
  useEffect(() => {
    if (!moment.audioUrl) return;
    const el = new Audio(moment.audioUrl);
    el.onended = () => { setVoicePlaying(false); audioEngine.unduck(); };
    el.onpause = () => { setVoicePlaying(false); audioEngine.unduck(); };
    el.onloadedmetadata = () => {
      if (el.duration && isFinite(el.duration) && el.duration > 0) {
        onAudioDuration?.(el.duration);
      }
    };
    voiceElRef.current = el;
    return () => { el.pause(); el.src = ''; audioEngine.unduck(); };
  }, [moment.audioUrl]);

  // Auto-play voice when moment enters reading phase
  useEffect(() => {
    if (phase === 'reading' && autoPlayVoice && hasAudio && voiceElRef.current) {
      const el = voiceElRef.current;
      el.currentTime = 0;
      audioEngine.duck();
      el.play().then(() => setVoicePlaying(true)).catch(() => audioEngine.unduck());
    }
  // The error message "Definition for rule 'react-hooks/exhaustive-deps' was not found"
  // indicates an issue with ESLint configuration, not a TypeScript syntax error.
  // The comment disabling the rule for the line below is the intended way to handle it
  // if you explicitly want to ignore that specific rule warning for this useEffect.
  // If the ESLint rule itself is not found, it means the linter setup is incomplete or incorrect.
  // However, from a pure TypeScript syntax perspective, the code is valid.
  // No change is needed for the TS syntax.
  }, [phase, autoPlayVoice, hasAudio]);

  // Stop voice when card leaves
  useEffect(() => {
    if (phase === 'leaving' || phase === 'gap') {
      voiceElRef.current?.pause();
      setVoicePlaying(false);
      audioEngine.unduck();
    }
  }, [phase]);

  const toggleVoice = useCallback(() => {
    const el = voiceElRef.current;
    if (!el) return;
    if (voicePlaying) {
      el.pause();
      setVoicePlaying(false);
      audioEngine.unduck();
    } else {
      audioEngine.duck();
      el.currentTime = 0;
      el.play().catch(() => { audioEngine.unduck(); });
      setVoicePlaying(true);
    }
  }, [voicePlaying]);

  // ── Card phase transitions ────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'entering') {
      setCardPhase('hidden');
      const raf = requestAnimationFrame(() => {
        const t = setTimeout(() => setCardPhase('entering'), 20);
        return () => clearTimeout(t);
      });
      return () => cancelAnimationFrame(raf);
    }
    setCardPhase(phase);
  }, [phase]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-5 sm:px-8" style={{ zIndex: 10 }}>
      <div className="w-full max-w-[460px] pointer-events-auto" style={buildStyle(cardPhase, readDur)}>
        <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-9 shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <AvatarWithAudio
                avatarUrl={moment.avatarUrl}
                isPlaying={voicePlaying}
                hasAudio={hasAudio}
                typeColor={typeColor}
                onClick={hasAudio ? toggleVoice : undefined}
              />
              <span className="text-[10px] font-semibold tracking-[0.22em] uppercase" style={{ color: typeColor, fontFamily: 'Inter,system-ui,sans-serif' }}>
                {moment.type}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Pin control */}
              {!isPinned ? (
                <button onClick={onPin}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-white/35 hover:text-white/68 hover:bg-white/8 transition-all"
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
                className="p-1.5 rounded-lg text-white/25 hover:text-white/65 hover:bg-white/8 transition-colors"
                aria-label="More options">
                <MoreHorizontal size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <p className={`${SIZES[textSize]} text-[#f0ebe0] mb-1`} style={{ fontFamily: bodyFont }}>
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

          {/* Voice note mini-player (when audio exists and settings allow) */}
          {hasAudio && (
            <div className="mt-4 pt-3 border-t border-white/8 flex items-center gap-2.5">
              <button
                onClick={toggleVoice}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                style={{ background: `${typeColor}18`, border: `1px solid ${typeColor}35` }}
                aria-label={voicePlaying ? 'Pause voice note' : 'Play voice note'}
              >
                {voicePlaying
                  ? <Pause size={10} fill={typeColor} style={{ color: typeColor }} />
                  : <Play size={10} fill={typeColor} style={{ color: typeColor }} />
                }
              </button>
              <div className="flex items-end gap-[2px] flex-1">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="rounded-full flex-1"
                    style={{
                      height: `${4 + Math.abs(Math.sin(i * 0.9)) * 8}px`,
                      background: typeColor,
                      opacity: voicePlaying ? (0.3 + (i % 3) * 0.18) : 0.18,
                      transition: 'opacity 300ms ease',
                      animationName: voicePlaying ? 'soundBar' : undefined,
                      animationDuration: voicePlaying ? `${0.4 + (i % 5) * 0.07}s` : undefined,
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 'infinite',
                      animationDirection: 'alternate',
                      animationDelay: `${i * 0.04}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-white/30 flex-shrink-0">voice</span>
            </div>
          )}
        </div>

        {/* Pinned indicator below card */}
        {isPinned && (
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
