
import { useState, useEffect, useRef, useCallback } from 'react';
import { StreamPhase, AtmosphereId, UserSettings } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useStream } from '@/hooks/useStream';
import { useAtmosphere } from '@/hooks/useAtmosphere';
import { useDisplay } from '@/hooks/useDisplay';
import { audioEngine } from '@/lib/audioEngine';
import { calcReadingTime } from '@/lib/utils';
import { createMoment } from '@/lib/api';
import BackgroundLayer from '@/components/features/BackgroundLayer';
import StreamCard from '@/components/features/StreamCard';
import FilmDisplay from '@/components/features/FilmDisplay';
import CarouselDisplay from '@/components/features/CarouselDisplay';
import DusterDisplay from '@/components/features/DusterDisplay';
import Composer from '@/components/features/Composer';
import AuthModal from '@/components/features/AuthModal';
import ReportModal from '@/components/features/ReportModal';
import Settings from '@/components/features/Settings';
import AtmospherePanel from '@/components/features/AtmospherePanel';
import DisplayPanel from '@/components/features/DisplayPanel';
import StreamControls from '@/components/layout/StreamControls';
import { toast } from 'sonner';

type Modal = 'none' | 'composer' | 'auth' | 'settings' | 'atmosphere' | 'display';

export default function Stream() {
  const { user, loading: authLoading, sendOtp, verifyOtp, signOut, updateSettings, updateAvatar } = useAuth();
  const { currentMoment, nextMoment, addMoment, neighbours } = useStream(user?.id ?? null);
  const { atmosphere, setAtmosphere } = useAtmosphere();
  const { displayId, setDisplay } = useDisplay();

  const [phase, setPhase]                 = useState<StreamPhase>('gap');
  const [isPinned, setIsPinned]           = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [modal, setModal]                 = useState<Modal>('none');
  const [reportId, setReportId]           = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [volume, setVolume]               = useState(0.5);
  /** Voice note duration (ms) for current moment — triggers reading-timer recalc when it arrives */
  const [voiceDurationMs, setVoiceDurationMs] = useState(0);

  const phaseRef  = useRef<ReturnType<typeof setTimeout>>();
  const idleRef   = useRef<ReturnType<typeof setTimeout>>();
  const pinnedRef = useRef(isPinned);
  pinnedRef.current = isPinned;

  // Reset voice duration whenever the moment changes
  useEffect(() => { setVoiceDurationMs(0); }, [currentMoment?.id]);

  const handleAudioDuration = useCallback((seconds: number) => {
    // Store with a small 600ms tail so the moment doesn't cut off right as audio ends
    setVoiceDurationMs(seconds * 1000 + 600);
  }, []);

  // Sync volume from user settings
  useEffect(() => { if (user) setVolume(user.settings.volume); }, [user?.id, user?.settings.volume]);

  // ── Stream phase state machine ────────────────────────────────────────────
  // When pinned, we simply don't schedule the next timer — the moment stays.
  useEffect(() => {
    if (!currentMoment) return;
    if (isPinned) return; // frozen while pinned
    clearTimeout(phaseRef.current);

    if (phase === 'gap') {
      phaseRef.current = setTimeout(() => setPhase('entering'), 2600);
    } else if (phase === 'entering') {
      phaseRef.current = setTimeout(() => setPhase('reading'), 850);
    } else if (phase === 'reading') {
      const textDur = calcReadingTime(currentMoment.body);
      // If a voice note duration is known, use the longer of the two
      const dur = voiceDurationMs > 0 ? Math.max(voiceDurationMs, textDur) : textDur;
      phaseRef.current = setTimeout(() => setPhase('leaving'), dur);
    } else if (phase === 'leaving') {
      phaseRef.current = setTimeout(() => { nextMoment(); setPhase('gap'); }, 800);
    }
    return () => clearTimeout(phaseRef.current);
  }, [phase, currentMoment?.id, currentMoment?.body, isPinned, nextMoment, voiceDurationMs]);

  // ── Pin / Let go ──────────────────────────────────────────────────────────
  const handlePin = useCallback(() => {
    // Can only pin during reading phase
    if (phase !== 'reading') return;
    clearTimeout(phaseRef.current);
    setIsPinned(true);
  }, [phase]);

  const handleLetGo = useCallback(() => {
    setIsPinned(false);
    // Skip whatever would have been next — go straight to leaving then rejoin fresh
    setPhase('leaving');
  }, []);

  // ── Controls idle fade ────────────────────────────────────────────────────
  const resetIdle = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => setControlsVisible(false), 3800);
  }, []);

  useEffect(() => { resetIdle(); return () => clearTimeout(idleRef.current); }, [resetIdle]);

  // ── Audio — Deep Focus plays universally; atmosphere never changes the track ─
  const handleToggleAudio = useCallback(() => {
    audioEngine.setVolume(volume);
    audioEngine.toggle();
    setIsAudioPlaying(audioEngine.isPlaying);
  }, [volume]);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    audioEngine.setVolume(v);
    if (user) updateSettings({ volume: v });
  }, [user, updateSettings]);

  // ── Compose ───────────────────────────────────────────────────────────────
  const handleCompose = () => setModal(user ? 'composer' : 'auth');

  const handleSubmit = async (data: { type: any; body: string; polaroidFile?: File; audioFile?: File }) => {
    if (!user) { setModal('auth'); return; }
    try {
      const moment = await createMoment({
        userId: user.id,
        type: data.type,
        body: data.body,
        polaroidFile: data.polaroidFile,
        audioFile: data.audioFile,
        avatarUrl: user.avatarUrl ?? `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face`,
      });
      if (moment) {
        addMoment(moment);
        clearTimeout(phaseRef.current);
        setIsPinned(false);
        setPhase('gap');
      }
      setModal('none');
      setTimeout(() => toast("It's out there now.", { duration: 3200 }), 150);
    } catch {
      toast.error('Could not post. Please try again.');
    }
  };

  const handleVerifyOtp = useCallback(async (email: string, token: string) => {
    await verifyOtp(email, token);
  }, [verifyOtp]);

  const textSize = user?.settings.textSize ?? 'md';
  const enableVoiceAudio = user?.settings.enableVoiceAudio ?? true;
  const autoPlayVoice = user?.settings.autoPlayVoice ?? false;
  const [prevNeighbour, nextNeighbour] = neighbours;

  // Shared props for Film/Carousel
  const displayProps = {
    moment: currentMoment!,
    phase,
    textSize,
    isPinned,
    enableVoiceAudio,
    autoPlayVoice,
    onReport: () => setReportId(currentMoment!.id),
    onPin: handlePin,
    onLetGo: handleLetGo,
    neighbours: [prevNeighbour, nextNeighbour] as [typeof prevNeighbour, typeof nextNeighbour],
  };

  const showContent = !!currentMoment && phase !== 'gap';

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#08080f]"
      onMouseMove={resetIdle}
      onTouchStart={resetIdle}
      onKeyDown={resetIdle}
      tabIndex={0}
      style={{ outline: 'none' }}
      role="main"
      aria-label="Scruttin Stream"
    >
      <BackgroundLayer atmosphere={atmosphere} />

      {authLoading && (
        <div className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-white/18 animate-pulse" />
        </div>
      )}

      {/* ── Active display ── */}
      {showContent && displayId === 'float' && (
        <StreamCard
          key={currentMoment.id}
          moment={currentMoment}
          phase={phase}
          textSize={textSize}
          isPinned={isPinned}
          enableVoiceAudio={enableVoiceAudio}
          autoPlayVoice={autoPlayVoice}
          onReport={() => setReportId(currentMoment.id)}
          onPin={handlePin}
          onLetGo={handleLetGo}
          onAudioDuration={handleAudioDuration}
        />
      )}
      {showContent && displayId === 'film' && (
        <FilmDisplay key={currentMoment.id} {...displayProps} />
      )}
      {showContent && displayId === 'carousel' && (
        <CarouselDisplay key={currentMoment.id} {...displayProps} />
      )}
      {showContent && displayId === 'duster' && (
        <DusterDisplay
          key={currentMoment.id}
          moment={currentMoment}
          phase={phase}
          textSize={textSize}
          isPinned={isPinned}
          enableVoiceAudio={enableVoiceAudio}
          autoPlayVoice={autoPlayVoice}
          onReport={() => setReportId(currentMoment.id)}
          onPin={handlePin}
          onLetGo={handleLetGo}
        />
      )}

      <StreamControls
        visible={controlsVisible}
        user={user}
        atmosphere={atmosphere}
        displayId={displayId}
        isAudioPlaying={isAudioPlaying}
        onMenu={() => setModal('settings')}
        onAudio={handleToggleAudio}
        onAtmosphere={() => setModal('atmosphere')}
        onDisplay={() => setModal('display')}
        onCompose={handleCompose}
        onSignIn={() => setModal('auth')}
      />

      {/* ── Modals ── */}
      {modal === 'composer' && (
        <Composer onClose={() => setModal('none')} onSubmit={handleSubmit} userAvatar={user?.avatarUrl} />
      )}
      {modal === 'auth' && (
        <AuthModal onClose={() => setModal('none')} onSendOtp={sendOtp} onVerifyOtp={handleVerifyOtp} />
      )}
      {modal === 'settings' && (
        <Settings user={user} onClose={() => setModal('none')} onSignOut={signOut}
          onUpdateSettings={(s: Partial<UserSettings>) => updateSettings(s)} onUpdateAvatar={updateAvatar} />
      )}
      {modal === 'atmosphere' && (
        <AtmospherePanel
          current={atmosphere}
          onSelect={(id: AtmosphereId) => setAtmosphere(id)}
          onClose={() => setModal('none')}
          isPlaying={isAudioPlaying}
          onToggleAudio={handleToggleAudio}
          volume={volume}
          onVolumeChange={handleVolumeChange}
        />
      )}
      {modal === 'display' && (
        <DisplayPanel current={displayId} onSelect={setDisplay} onClose={() => setModal('none')} />
      )}
      {reportId && (
        <ReportModal momentId={reportId} reporterId={user?.id ?? null} onClose={() => setReportId(null)} />
      )}
    </div>
  );
}
