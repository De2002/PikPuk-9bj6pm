import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { submitReport } from '@/lib/api';

interface Props {
  momentId: string;
  reporterId: string | null;
  onClose: () => void;
}

const REASONS = [
  { value: 'spam',       label: 'Spam or repetitive' },
  { value: 'harmful',    label: 'Harmful or threatening' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'sexual',     label: 'Sexually explicit' },
  { value: 'other',      label: 'Something else' },
];

export default function ReportModal({ momentId, reporterId, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!reason || busy) return;
    setBusy(true);

    if (reporterId) {
      await submitReport(reporterId, momentId, reason);
    }

    setDone(true);
    setTimeout(() => { onClose(); toast.success("Thank you. We'll review this."); }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/58 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 glass-strong rounded-2xl w-full max-w-sm mx-4 p-6">
        <button onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/35 hover:text-white/72 hover:bg-white/8 transition-colors"
          aria-label="Close">
          <X size={17} />
        </button>

        {done ? (
          <div className="py-8 text-center">
            <p className="text-[#f0ebe0]/70 text-sm">Reported.</p>
          </div>
        ) : (
          <>
            <h3 className="text-[#f0ebe0] font-medium mb-1 pr-8">Report this moment</h3>
            <p className="text-white/38 text-xs mb-5">What's the issue?</p>
            <div className="space-y-2 mb-5">
              {REASONS.map(r => (
                <button key={r.value} onClick={() => setReason(r.value)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    background: reason === r.value ? 'rgba(196,181,253,0.1)' : 'rgba(255,255,255,0.03)',
                    color: reason === r.value ? '#c4b5fd' : 'rgba(240,235,224,0.65)',
                    border: reason === r.value ? '1px solid rgba(196,181,253,0.28)' : '1px solid rgba(255,255,255,0.05)',
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={onClose} className="text-xs text-white/32 hover:text-white/55 px-3 py-2 transition-colors">Cancel</button>
              <button onClick={submit} disabled={!reason || busy}
                className="px-5 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-28"
                style={{ background: 'rgba(196,181,253,0.1)', color: '#c4b5fd', border: '1px solid rgba(196,181,253,0.22)' }}>
                {busy ? 'Sending...' : 'Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
