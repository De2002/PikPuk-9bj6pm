import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Globe2, Mic2, Sparkles, Waves } from 'lucide-react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2200&q=88';

export default function Landing() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  const waveform = useMemo(
    () => [22, 44, 30, 66, 38, 78, 51, 92, 62, 34, 74, 48, 88, 40, 68, 28, 56, 36, 76, 46, 30, 61, 42, 72],
    [],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08131a] text-[#f6f2e9]">
      <img
        src={HERO_IMAGE}
        alt="A star-filled mountain landscape at night"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[#08131a]/55" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#08131a]/90 via-transparent to-[#e0774f]/35" />

      <div
        className="relative z-10 flex min-h-screen flex-col px-6 py-6 sm:px-10 sm:py-8"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 900ms ease, transform 900ms ease',
        }}
      >
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#f6f2e9] text-[#08131a]">
              <Waves aria-hidden="true" className="size-5" />
            </span>
            <span className="font-sans text-lg font-semibold tracking-tight">Scruttin</span>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#f6f2e9]/20 bg-[#08131a]/25 px-4 py-2 text-xs tracking-[0.18em] text-[#f6f2e9]/75 backdrop-blur-md sm:flex">
            <Globe2 aria-hidden="true" className="size-3.5" />
            GLOBAL VOICES
          </div>
        </header>

        <section className="flex flex-1 items-center py-16 sm:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 flex items-center gap-3 text-sm text-[#f6f2e9]/75">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#e0774f] text-[#08131a]">
                <Sparkles aria-hidden="true" className="size-4" />
              </span>
              <span className="tracking-[0.16em]">A LITTLE SPACE FOR YOUR VOICE</span>
            </div>
            <h1 className="max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-balance sm:text-7xl lg:text-8xl">
              Think. Dream. <span className="text-[#e0774f]">Share.</span>
            </h1>
            <p className="mt-7 max-w-xl font-sans text-lg leading-relaxed text-[#f6f2e9]/78 sm:text-xl">
              Scruttin is a global voices platform for thoughts, dreams, memories, and moments — shared in 60 seconds or less.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate('/stream')}
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#f6f2e9] px-7 py-4 font-sans text-sm font-semibold tracking-wide text-[#08131a] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6f2e9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08131a]"
              >
                Enter the stream
                <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
              <span className="font-sans text-sm text-[#f6f2e9]/55">No polish required. Just press record.</span>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-5 border-t border-[#f6f2e9]/20 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-full border border-[#f6f2e9]/30 bg-[#08131a]/30 backdrop-blur-md">
              <Mic2 aria-hidden="true" className="size-5 text-[#e0774f]" />
            </div>
            <div>
              <p className="font-sans text-sm font-medium">One minute. Infinite worlds.</p>
              <p className="mt-1 font-sans text-xs text-[#f6f2e9]/55">Musical, visual, human.</p>
            </div>
          </div>
          <div className="flex items-center gap-1" aria-label="Audio waveform decoration">
            {waveform.map((height, index) => (
              <span
                key={`${height}-${index}`}
                className="w-1 rounded-full bg-[#e0774f]"
                style={{ height: `${height / 2}px`, animation: `soundBar ${1 + (index % 4) * 0.2}s ease-in-out infinite alternate` }}
              />
            ))}
            <span className="ml-3 font-mono text-xs text-[#f6f2e9]/60">00:60</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
