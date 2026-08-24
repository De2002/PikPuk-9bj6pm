import { useState, useRef } from 'react';
import { X, LogOut, Trash2, Upload, Volume2, VolumeX } from 'lucide-react';
import { User, UserSettings, TextSize } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  user: User | null;
  onClose: () => void;
  onSignOut: () => void;
  onUpdateSettings: (s: Partial<UserSettings>) => void;
  onUpdateAvatar: (file: File) => Promise<void>;
}

export default function Settings({ user, onClose, onSignOut, onUpdateSettings, onUpdateAvatar }: Props) {
  const [textSize, setTextSize] = useState<TextSize>(user?.settings.textSize ?? 'md');
  const [enableVoiceAudio, setEnableVoiceAudio] = useState<boolean>(user?.settings.enableVoiceAudio ?? true);
  const [autoPlayVoice, setAutoPlayVoice] = useState<boolean>(user?.settings.autoPlayVoice ?? false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const changeSize = (s: TextSize) => { setTextSize(s); onUpdateSettings({ textSize: s }); };

  const toggleVoiceAudio = () => {
    const next = !enableVoiceAudio;
    setEnableVoiceAudio(next);
    // If disabling voice audio, also disable auto-play
    if (!next && autoPlayVoice) {
      setAutoPlayVoice(false);
      onUpdateSettings({ enableVoiceAudio: next, autoPlayVoice: false });
    } else {
      onUpdateSettings({ enableVoiceAudio: next });
    }
  };

  const toggleAutoPlay = () => {
    const next = !autoPlayVoice;
    setAutoPlayVoice(next);
    onUpdateSettings({ autoPlayVoice: next });
  };

  const handleSignOut = () => { onSignOut(); onClose(); };
  const handleDelete = () => {
    if (!window.confirm('Permanently delete your account?')) return;
    onSignOut(); onClose();
  };

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) { toast.error('Image must be under 2 MB'); return; }
    setUploading(true);
    try {
      await onUpdateAvatar(file);
      toast.success('Profile picture updated');
    } catch {
      toast.error('Failed to update picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/58 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 glass-strong rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4 max-h-[88vh] overflow-y-auto no-scrollbar">

        <div className="sticky top-0 glass-strong px-6 py-4 flex items-center justify-between border-b border-white/7">
          <h2 className="text-[#f0ebe0] font-medium tracking-wide">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full text-white/38 hover:text-white/72 hover:bg-white/8 transition-colors" aria-label="Close settings">
            <X size={17} />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* Account info with avatar upload */}
          {user && (
            <section>
              <h3 className="text-white/38 text-[10px] uppercase tracking-[0.2em] mb-4">You</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="relative w-14 h-14 rounded-full overflow-hidden ring-1 ring-white/12 bg-white/5 flex items-center justify-center group flex-shrink-0"
                  aria-label="Change profile picture"
                  title="Change profile picture">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/30 text-xl font-serif">{user.email[0].toUpperCase()}</span>
                  )}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading
                      ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      : <Upload size={13} className="text-white/80" />
                    }
                  </div>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                <div>
                  <p className="text-[#f0ebe0] text-sm">{user.email}</p>
                  <p className="text-white/30 text-xs mt-0.5">Anonymous to others</p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs text-white/28 hover:text-white/55 mt-1.5 transition-colors">
                    Change picture
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Experience */}
          <section className="space-y-5">
            <h3 className="text-white/38 text-[10px] uppercase tracking-[0.2em]">Experience</h3>

            {/* Text size */}
            <div>
              <p className="text-[#f0ebe0]/60 text-sm mb-2.5">Text size</p>
              <div className="flex gap-2">
                {(['sm', 'md', 'lg'] as TextSize[]).map(s => (
                  <button key={s} onClick={() => changeSize(s)}
                    className={cn('flex-1 py-2.5 rounded-xl text-sm transition-all',
                      textSize === s
                        ? 'bg-white/11 text-[#f0ebe0] border border-white/18'
                        : 'text-white/38 border border-white/7 hover:text-white/58')}>
                    {s === 'sm' ? 'Sm' : s === 'md' ? 'Md' : 'Lg'}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice audio toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#f0ebe0]/70 text-sm">Voice notes</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {enableVoiceAudio
                      ? 'Play voice recordings on moments'
                      : 'Voice notes hidden — tap to enable'}
                  </p>
                </div>
                <button
                  onClick={toggleVoiceAudio}
                  className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300 focus:outline-none"
                  style={{
                    background: enableVoiceAudio
                      ? 'rgba(196,181,253,0.45)'
                      : 'rgba(255,255,255,0.12)',
                    border: `1px solid ${enableVoiceAudio ? 'rgba(196,181,253,0.6)' : 'rgba(255,255,255,0.15)'}`,
                  }}
                  aria-pressed={enableVoiceAudio}
                  aria-label="Toggle voice audio"
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-md flex items-center justify-center"
                    style={{
                      transform: enableVoiceAudio ? 'translateX(20px)' : 'translateX(0)',
                      background: enableVoiceAudio ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {enableVoiceAudio
                      ? <Volume2 size={10} style={{ color: 'rgba(8,8,20,0.85)' }} />
                      : <VolumeX size={9} style={{ color: 'rgba(8,8,20,0.55)' }} />
                    }
                  </span>
                </button>
              </div>

              {/* Auto-play sub-option — only shown when voice notes are enabled */}
              {enableVoiceAudio && (
                <div
                  className="flex items-center justify-between pl-4 border-l transition-all"
                  style={{ borderColor: 'rgba(196,181,253,0.18)' }}
                >
                  <div>
                    <p className="text-[#f0ebe0]/55 text-sm">Auto-play on arrival</p>
                    <p className="text-white/25 text-xs mt-0.5">
                      {autoPlayVoice
                        ? 'Voice plays as each moment appears'
                        : 'Tap the avatar to play manually'}
                    </p>
                  </div>
                  <button
                    onClick={toggleAutoPlay}
                    className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300 focus:outline-none"
                    style={{
                      background: autoPlayVoice
                        ? 'rgba(196,181,253,0.32)'
                        : 'rgba(255,255,255,0.09)',
                      border: `1px solid ${autoPlayVoice ? 'rgba(196,181,253,0.48)' : 'rgba(255,255,255,0.12)'}`,
                    }}
                    aria-pressed={autoPlayVoice}
                    aria-label="Toggle voice auto-play"
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-md"
                      style={{
                        transform: autoPlayVoice ? 'translateX(20px)' : 'translateX(0)',
                        background: autoPlayVoice ? '#c4b5fd' : 'rgba(255,255,255,0.38)',
                      }}
                    />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Sign out / delete */}
          {user && (
            <section className="space-y-1 pb-2">
              <h3 className="text-white/38 text-[10px] uppercase tracking-[0.2em] mb-3">Account</h3>
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#f0ebe0]/62 hover:text-[#f0ebe0] hover:bg-white/5 transition-all">
                <LogOut size={15} className="text-white/38" />Sign out
              </button>
              <button onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400/58 hover:text-red-400 hover:bg-red-500/5 transition-all">
                <Trash2 size={15} />Delete account
              </button>
            </section>
          )}

          {!user && (
            <p className="text-white/30 text-sm text-center pb-2">Sign in to access settings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
