import { useEffect, useState, useRef, useCallback } from 'react';
import { Moment, StreamPhase, TextSize, SPACES } from '@/types';
import { calcReadingTime } from '@/lib/utils';
import { audioEngine } from '@/lib/audioEngine';
import { ExternalLink, Play, Pause } from 'lucide-react';

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
  onAudioDuration?: (seconds: number) => void;
}

// ── Tiny markdown renderer (bold, italic, links, headings, line breaks) ───────
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    // Heading
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h2) return <p key={li} className="font-semibold text-[#f0ebe0] mb-1 mt-3 text-base">{h2[1]}</p>;
    if (h3) return <p key={li} className="font-medium text-[#f0ebe0]/80 mb-1 mt-2 text-sm">{h3[1]}</p>;
    if (line.trim() === '') return <br key={li} />;

    // Inline: bold, italic, code, links
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;
    while (remaining.length > 0) {
      const boldMatch  = remaining.match(/^\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/^_(.+?)_/);
      const codeMatch  = remaining.match(/^`(.+?)`/);
      const linkMatch  = remaining.match(/^\[(.+?)\]\((https?:\/\/[^\s)]+)\)/);

      if (boldMatch) {
        parts.push(<strong key={key++} className="font-semibold text-[#f0ebe0]">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
      } else if (italicMatch) {
        parts.push(<em key={key++} className="italic text-[#f0ebe0]/85">{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
      } else if (codeMatch) {
        parts.push(<code key={key++} className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded text-[#c4b5fd]">{codeMatch[1]}</code>);
        remaining = remaining.slice(codeMatch[0].length);
      } else if (linkMatch) {
        parts.push(
          <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
            className="underline underline-offset-2 text-[#93c5fd] hover:text-[#bfdbfe] transition-colors"
          >{linkMatch[1]}</a>
        );
        remaining = remaining.slice(linkMatch[0].length);
      } else {
        const nextSpecial = Math.min(
          ...[/\*\*/, /_/, /`/, /\[/].map(r => { const m = remaining.search(r); return m === -1 ? Infinity : m; })
        );
        if (nextSpecial === Infinity || nextSpecial === 0) {
          parts.push(<span key={key++}>{remaining[0]}</span>);
          remaining = remaining.slice(1);
        } else {
          parts.push(<span key={key++}>{remaining.slice(0, nextSpecial)}</span>);
          remaining = remaining.slice(nextSpecial);
        }
      }
    }
    return <p key={li} className="mb-0 leading-relaxed">{parts}</p>;
  });
}

// ── Typing effect for text-only moments ──────────────────────────────────────
function useTypingReveal(text: string, active: boolean, charsPerMs = 0.055) {
  const [revealedChars, setRevealedChars] = useState(0);
  const rafRef = useRef<number>();
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) { setRevealedChars(text.length); return; }
    setRevealedChars(0);
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const chars = Math.floor(elapsed * charsPerMs);
      setRevealedChars(Math.min(chars, text.length));
      if (chars < text.length) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [text, active]);

  return revealedChars;
}

// ── Space badge ───────────────────────────────────────────────────────────────
function SpaceBadge({ spaceId }: { spaceId: string }) {
  const label = SPACES.find(s => s.id === spaceId)?.label ?? spaceId;
  if (spaceId === 'general') return null;
  return (
    <span className="inline-block text-[9px] tracking-[0.22em] uppercase font-bold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.1)' }}>
      {label}
    </span>
  );
}

// ── Avatar with optional audio-playing rings ──────────────────────────────────
function AvatarRipple({ avatarUrl, isPlaying, hasAudio, typeColor, onClick }: {
  avatarUrl: string; isPlaying: boolean; hasAudio: boolean; typeColor: string; onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={!hasAudio}
      className="relative flex-shrink-0 focus:outline-none"
      style={{ cursor: hasAudio ? 'pointer' : 'default' }}>
      {isPlaying && ['0s','0.45s','0.9s'].map((delay, i) => (
        <span key={i} className="absolute inset-0 rounded-full pointer-events-none" style={{
          border: `1.5px solid ${typeColor}`,
          animationName: 'voiceRipple', animationDuration: '1.4s',
          animationTimingFunction: 'ease-out', animationIterationCount: 'infinite',
          animationDelay: delay,
        }} />
      ))}
      <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/14 bg-white/8">
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" draggable={false}
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
      </div>
      {hasAudio && !isPlaying && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
          style={{ background: typeColor, border: '1.5px solid rgba(8,8,20,0.9)' }}>
          <Play size={6} fill="rgba(8,8,20,0.9)" className="ml-[1px]" />
        </span>
      )}
    </button>
  );
}

const TEXT_SIZES: Record<TextSize, string> = {
  sm: 'text-sm leading-relaxed',
  md: 'text-base leading-relaxed',
  lg: 'text-lg leading-loose',
};

export default function StreamCard({
  moment, phase, textSize = 'md', isPinned, enableVoiceAudio, autoPlayVoice,
  onPass, onPin, onLetGo, onAudioDuration,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const voiceElRef = useRef<HTMLAudioElement | null>(null);

  const isDream = moment.type === 'dream';
  const typeColor = isDream ? '#c4b5fd' : '#fbbf24';
  const bodyFont = isDream ? '"Playfair Display", Georgia, serif' : 'Inter, system-ui, sans-serif';
  const hasAudio = !!moment.audioUrl && enableVoiceAudio;
  const readDur = calcReadingTime(moment.body);

  // Typing effect only for text-only moments during reading phase
  const useTyping = !hasAudio && phase === 'reading';
  const revealedChars = useTypingReveal(moment.body, useTyping, 0.06);
  const displayedBody = useTyping ? moment.body.slice(0, revealedChars) : moment.body;

  // ── Voice audio ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!moment.audioUrl) return;
    const el = new Audio(moment.audioUrl);
    el.onended = () => { setVoicePlaying(false); audioEngine.unduck(); };
    el.onpause = () => { setVoicePlaying(false); audioEngine.unduck(); };
    el.onloadedmetadata = () => {
      if (el.duration && isFinite(el.duration) && el.duration > 0) onAudioDuration?.(el.duration);
    };
    voiceElRef.current = el;
    return () => { el.pause(); el.src = ''; audioEngine.unduck(); };
  }, [moment.audioUrl]);

  useEffect(() => {
    if (phase === 'reading' && autoPlayVoice && hasAudio && voiceElRef.current) {
      const el = voiceElRef.current;
      el.currentTime = 0;
      audioEngine.duck();
      el.play().then(() => setVoicePlaying(true)).catch(() => audioEngine.unduck());
    }
  }, [phase, autoPlayVoice, hasAudio]);

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
    if (voicePlaying) { el.pause(); setVoicePlaying(false); audioEngine.unduck(); }
    else { audioEngine.duck(); el.currentTime = 0; el.play().catch(() => audioEngine.unduck()); setVoicePlaying(true); }
  }, [voicePlaying]);

  // ── Card visibility transitions ───────────────────────────────────────────
  useEffect(() => {
    if (phase === 'entering') {
      setVisible(false);
      const id = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(id);
    }
    if (phase === 'reading') setVisible(true);
    if (phase === 'leaving' || phase === 'gap') setVisible(false);
  }, [phase]);

  const cardStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible
      ? 'translateY(0)'
      : phase === 'leaving' ? 'translateY(-20px)' : 'translateY(28px)',
    transition: phase === 'entering'
      ? 'opacity 820ms cubic-bezier(0.22,1,0.36,1), transform 820ms cubic-bezier(0.22,1,0.36,1)'
      : phase === 'leaving'
      ? 'opacity 700ms ease, transform 700ms ease'
      : 'opacity 200ms ease',
  };

  const hasLongBody = moment.body.length > 500;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4 sm:px-8" style={{ zIndex: 10 }}>
      <div className="w-full max-w-[500px] pointer-events-auto" style={cardStyle}>
        <div className="glass rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">

          {/* ── Author row ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-0">
            <AvatarRipple
              avatarUrl={moment.avatarUrl}
              isPlaying={voicePlaying}
              hasAudio={hasAudio}
              typeColor={typeColor}
              onClick={hasAudio ? toggleVoice : undefined}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {moment.authorName ? (
                  <span className="text-sm font-medium text-[#f0ebe0]/90 truncate">{moment.authorName}</span>
                ) : (
                  <span className="text-xs text-white/30 italic">anonymous</span>
                )}
                {moment.websiteUrl && (
                  <a
                    href={moment.websiteUrl.startsWith('http') ? moment.websiteUrl : `https://${moment.websiteUrl}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-0.5 text-[11px] text-white/38 hover:text-white/65 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink size={10} />
                    <span className="truncate max-w-[120px]">{moment.websiteUrl.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: typeColor }}>
                  {moment.type}
                </span>
                <SpaceBadge spaceId={moment.space} />
              </div>
            </div>
          </div>

          {/* Scrollable content area */}
          <div
            className={hasLongBody ? 'overflow-y-auto max-h-[52vh] no-scrollbar' : ''}
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* ── Photo (above text) ────────────────────────────────────── */}
            {moment.polaroidUrl && (
              <div className="px-6 pt-5">
                <div className="w-full rounded-xl overflow-hidden bg-black/20">
                  <img
                    src={moment.polaroidUrl}
                    alt=""
                    className="w-full object-cover max-h-52"
                    draggable={false}
                    style={{ display: 'block' }}
                  />
                </div>
              </div>
            )}

            {/* ── Title ────────────────────────────────────────────────── */}
            {moment.title && (
              <div className="px-6 pt-4">
                <h2
                  className="text-lg font-semibold text-[#f0ebe0] leading-snug"
                  style={{ fontFamily: isDream ? '"Playfair Display",Georgia,serif' : 'Inter,system-ui,sans-serif' }}
                >
                  {moment.title}
                </h2>
              </div>
            )}

            {/* ── Body ─────────────────────────────────────────────────── */}
            <div className={`px-6 ${moment.title ? 'pt-2' : 'pt-4'} pb-4`}>
              <div
                className={`${TEXT_SIZES[textSize]} text-[#f0ebe0]/90`}
                style={{ fontFamily: bodyFont }}
              >
                {hasAudio || !useTyping
                  ? renderMarkdown(moment.body)
                  : renderMarkdown(displayedBody)
                }
                {useTyping && revealedChars < moment.body.length && (
                  <span className="inline-block w-[2px] h-[1em] bg-current opacity-70 ml-px"
                    style={{ verticalAlign: 'text-bottom', animationName: 'musicPulse', animationDuration: '0.8s', animationIterationCount: 'infinite', animationTimingFunction: 'step-end' }}
                  />
                )}
              </div>
            </div>

            {/* ── Audio player ─────────────────────────────────────────── */}
            {hasAudio && (
              <div className="mx-6 mb-4 pt-3 border-t border-white/8 flex items-center gap-2.5">
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
                  {Array.from({ length: 20 }).map((_, i) => (
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

          {/* ── Bottom controls: Pin + Pass ───────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/7">
            {!isPinned ? (
              <button onClick={onPin}
                className="flex items-center gap-1.5 text-[12px] text-white/35 hover:text-white/65 transition-colors"
                title="Hold this moment">
                <span>📌</span><span>Pin</span>
              </button>
            ) : (
              <button onClick={onLetGo}
                className="flex items-center gap-1.5 text-[12px] transition-all"
                style={{ color: typeColor }}>
                <span>📌</span><span>Let go →</span>
              </button>
            )}

            <button
              onClick={onPass}
              className="flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/60 transition-colors"
              title="Pass — never show again"
            >
              <span>Pass</span>
              <span className="text-white/20">→</span>
            </button>
          </div>
        </div>

        {isPinned && (
          <div className="text-center mt-2">
            <span className="text-[10px] tracking-[0.22em] uppercase text-white/28">
              Pinned · music plays on
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
