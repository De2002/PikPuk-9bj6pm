import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import bgNight from '@/assets/bg-night.jpg';

export default function Landing() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  const stars = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 2.5 + Math.random() * 4,
      delay: Math.random() * 5,
    })), []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background video — Pexels clip, with the original night image as a poster/fallback */}
      <div className="absolute inset-0 bg-background">
        <video
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster={bgNight}
          aria-hidden="true"
        >
          <source src="https://videos.pexels.com/video-files/3129595/3129595-hd_1920_1080_25fps.mp4" type="video/mp4" />
        </video>
        <img src={bgNight} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[rgba(4,4,14,0.64)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,8,28,0.15),rgba(4,4,14,0.78))]" />
      </div>

      {/* Twinkling stars overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map(s => (
          <div key={s.id} className="absolute rounded-full bg-white" style={{
            left: `${s.left}%`, top: `${s.top}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            animationName: 'starTwinkle',
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }} />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 1.4s ease, transform 1.4s ease',
        }}>

        {/* Logo */}
        <h1 className="font-serif text-5xl sm:text-7xl text-[#f0ebe0] tracking-wide font-medium mb-3">
          Scruttin
        </h1>

        {/* Tagline */}
        <p className="text-[#f0ebe0]/40 text-xs sm:text-sm tracking-[0.25em] uppercase font-sans mb-2">
          Dreams. Thoughts. Passing moments.
        </p>

        {/* Separator */}
        <div className="flex items-center gap-3 my-8">
          <div className="w-14 h-px bg-white/12" />
          <div className="w-1 h-1 rounded-full bg-white/22" />
          <div className="w-14 h-px bg-white/12" />
        </div>

        {/* Descriptor */}
        <p className="text-[#f0ebe0]/30 text-sm max-w-[280px] leading-relaxed mb-10 font-serif italic">
          A face. A dream or thought.<br />Then gone.
        </p>

        {/* Enter button */}
        <button
          onClick={() => navigate('/stream')}
          className="px-12 py-4 rounded-full font-sans text-xs tracking-[0.3em] uppercase transition-all duration-400"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(240,235,224,0.75)',
            border: '1px solid rgba(255,255,255,0.11)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget;
            el.style.background = 'rgba(255,255,255,0.1)';
            el.style.color = 'rgba(240,235,224,1)';
            el.style.borderColor = 'rgba(255,255,255,0.22)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget;
            el.style.background = 'rgba(255,255,255,0.05)';
            el.style.color = 'rgba(240,235,224,0.75)';
            el.style.borderColor = 'rgba(255,255,255,0.11)';
          }}
        >
          Enter
        </button>

        <p className="text-white/18 text-xs mt-8 max-w-[260px] leading-relaxed">
          No names. No followers. No going back.
        </p>
      </div>
    </div>
  );
}
