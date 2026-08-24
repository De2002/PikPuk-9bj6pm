import { useState } from 'react';
import { X, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onSendOtp: (email: string) => Promise<void>;
  onVerifyOtp: (email: string, token: string) => Promise<void>;
}

type Step = 'email' | 'otp' | 'done';

export default function AuthModal({ onClose, onSendOtp, onVerifyOtp }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await onSendOtp(email.trim());
      setStep('otp');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Could not send code.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) return;
    setBusy(true);
    try {
      await onVerifyOtp(email.trim(), otp.trim());
      setStep('done');
      setTimeout(onClose, 1000);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Invalid code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/58 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 glass-strong rounded-2xl w-full max-w-sm mx-4 p-8">
        <button onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/35 hover:text-white/72 hover:bg-white/8 transition-colors"
          aria-label="Close">
          <X size={17} />
        </button>

        {step === 'done' ? (
          <div className="py-8 text-center">
            <p className="font-serif text-2xl text-[#c4b5fd] mb-2">Welcome.</p>
            <p className="text-white/38 text-sm">You're in.</p>
          </div>
        ) : step === 'email' ? (
          <>
            <h2 className="font-serif text-2xl text-[#f0ebe0] mb-1">Join Scruttin</h2>
            <p className="text-sm text-white/38 mb-7">Enter your email — we'll send a code.</p>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs text-white/42 mb-1.5 block tracking-wide" htmlFor="pp-email">
                  Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/28 pointer-events-none" />
                  <input
                    id="pp-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                    className="w-full bg-white/5 border border-white/9 rounded-xl pl-9 pr-4 py-3 text-[#f0ebe0] placeholder-white/22 outline-none focus:border-white/22 transition-colors text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-35"
                style={{ background: 'rgba(196,181,253,0.1)', color: '#c4b5fd', border: '1px solid rgba(196,181,253,0.22)' }}>
                {busy ? 'Sending...' : <><span>Send code</span><ArrowRight size={14} /></>}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="font-serif text-2xl text-[#f0ebe0] mb-1">Check your email</h2>
            <p className="text-sm text-white/38 mb-1">We sent a code to</p>
            <p className="text-sm text-[#c4b5fd]/80 mb-7 truncate">{email}</p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="text-xs text-white/42 mb-1.5 block tracking-wide" htmlFor="pp-otp">
                  Code
                </label>
                <input
                  id="pp-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/9 rounded-xl px-4 py-3 text-[#f0ebe0] placeholder-white/22 outline-none focus:border-white/22 transition-colors text-sm tracking-[0.35em] text-center"
                />
              </div>
              <button
                type="submit"
                disabled={busy || otp.trim().length < 4}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-35"
                style={{ background: 'rgba(196,181,253,0.1)', color: '#c4b5fd', border: '1px solid rgba(196,181,253,0.22)' }}>
                {busy ? 'Verifying...' : <><span>Continue</span><ArrowRight size={14} /></>}
              </button>
            </form>

            <button
              onClick={() => { setOtp(''); setStep('email'); }}
              className="mt-4 w-full text-xs text-white/28 hover:text-white/55 py-2 transition-colors">
              ← Use a different email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
