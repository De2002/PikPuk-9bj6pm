import { useMemo, useState, useEffect, useRef } from 'react';
import { Atmosphere } from '@/types';
import bgForest from '@/assets/bg-forest.jpg';

interface Props { atmosphere: Atmosphere; }

// ── Reusable video background ─────────────────────────────────────────────────
interface VideoBgProps {
  sources: string[];
  fallback: React.ReactNode;
  tint: string;
  flicker?: boolean;
}

function VideoBg({ sources, fallback, tint, flicker = false }: VideoBgProps) {
  const [videoReady, setVideoReady] = useState(false);
  const [srcIdx, setSrcIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleError = () => {
    if (srcIdx < sources.length - 1) {
      setSrcIdx(i => i + 1);
      setVideoReady(false);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
  }, [srcIdx]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 transition-opacity duration-[2500ms] ease-in-out"
        style={{ opacity: videoReady ? 0 : 1 }}
      >
        {fallback}
      </div>

      {sources.length > 0 && srcIdx < sources.length && (
        <video
          ref={videoRef}
          key={sources[srcIdx]}
          src={sources[srcIdx]}
          autoPlay loop muted playsInline
          onCanPlay={() => setVideoReady(true)}
          onError={handleError}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2500ms] ease-in-out"
          style={{
            opacity: videoReady ? 1 : 0,
            ...(flicker ? {
              animationName: 'fireFlicker',
              animationDuration: '4s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            } : {}),
          }}
        />
      )}

      <div className="absolute inset-0 transition-all duration-[2000ms]" style={{ background: tint }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 22%, rgba(0,0,0,0.55) 100%)',
      }} />
    </div>
  );
}

// ── Ocean ─────────────────────────────────────────────────────────────────────
const OCEAN_IMAGES = [
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1920&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505459668311-8dfac7952bf0?w=1920&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=1920&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=1920&q=82&auto=format&fit=crop',
];
const OCEAN_VIDEOS = [
  'https://videos.pexels.com/video-files/1409899/1409899-sd_640_360_25fps.mp4',
  'https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4',
];

function OceanSlideshow() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const advance = () => {
      setFading(true);
      setTimeout(() => { setIdx(i => (i + 1) % OCEAN_IMAGES.length); setFading(false); }, 3000);
    };
    const timer = setInterval(advance, 13000);
    return () => clearInterval(timer);
  }, []);

  const prev = (idx - 1 + OCEAN_IMAGES.length) % OCEAN_IMAGES.length;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#020d1a' }}>
      <img key={`prev-${prev}`} src={OCEAN_IMAGES[prev]} alt="" aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0, transition: 'opacity 3000ms ease-in-out' }} draggable={false} />
      <img key={`curr-${idx}`} src={OCEAN_IMAGES[idx]} alt="" aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 3000ms ease-in-out' }} draggable={false} />
      <img key={`next-${(idx+1)%OCEAN_IMAGES.length}`} src={OCEAN_IMAGES[(idx+1)%OCEAN_IMAGES.length]} alt="" aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: fading ? 1 : 0, transition: 'opacity 3000ms ease-in-out' }} draggable={false} />
    </div>
  );
}

// ── Forest ────────────────────────────────────────────────────────────────────
const FOREST_IMAGES = [
  bgForest,
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1920&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1920&q=82&auto=format&fit=crop',
];
// Pexels: misty forest, forest path, trees with mist
const FOREST_VIDEOS = [
  'https://videos.pexels.com/video-files/4168708/4168708-sd_640_360_30fps.mp4',
  'https://videos.pexels.com/video-files/3571264/3571264-sd_640_360_30fps.mp4',
  'https://videos.pexels.com/video-files/4168708/4168708-hd_1920_1080_30fps.mp4',
];

function ForestSlideshow() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const advance = () => {
      setFading(true);
      setTimeout(() => { setIdx(i => (i + 1) % FOREST_IMAGES.length); setFading(false); }, 3500);
    };
    const timer = setInterval(advance, 14000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#020e06' }}>
      {FOREST_IMAGES.map((src, i) => (
        <img key={src} src={src} alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            opacity: i === idx ? (fading ? 0 : 1) : i === (idx + 1) % FOREST_IMAGES.length ? (fading ? 1 : 0) : 0,
            transition: 'opacity 3500ms ease-in-out',
          }}
          draggable={false}
        />
      ))}
    </div>
  );
}

// ── Fire ──────────────────────────────────────────────────────────────────────
const FIRE_IMAGES = [
  'https://images.unsplash.com/photo-1415887742784-a5e9d7c55f70?w=1920&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85&auto=format&fit=crop',
];
const FIRE_VIDEOS = [
  'https://videos.pexels.com/video-files/4172872/4172872-sd_640_360_25fps.mp4',
  'https://videos.pexels.com/video-files/4172872/4172872-hd_1920_1080_25fps.mp4',
];

function FireFallback() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % FIRE_IMAGES.length), 9000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {FIRE_IMAGES.map((src, i) => (
        <img key={src} src={src} alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 2800ms ease-in-out',
            animationName: i === idx ? 'fireFlicker' : undefined,
            animationDuration: '4s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }}
          draggable={false}
        />
      ))}
    </div>
  );
}

// ── Night sky ─────────────────────────────────────────────────────────────────
// Pexels: night sky, milky way, star timelapse
const NIGHT_IMAGES = [
  'https://images.unsplash.com/photo-1475274047050-1d0c0975de51?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1920&q=80&auto=format&fit=crop',
];
const NIGHT_VIDEOS = [
  'https://videos.pexels.com/video-files/1851190/1851190-sd_640_360_24fps.mp4',
  'https://videos.pexels.com/video-files/1851190/1851190-hd_1920_1080_24fps.mp4',
];

function NightSlideshow() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const advance = () => {
      setFading(true);
      setTimeout(() => { setIdx(i => (i + 1) % NIGHT_IMAGES.length); setFading(false); }, 4000);
    };
    const t = setInterval(advance, 16000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#02020e' }}>
      {NIGHT_IMAGES.map((src, i) => (
        <img key={src} src={src} alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            opacity: i === idx ? (fading ? 0 : 1) : i === (idx + 1) % NIGHT_IMAGES.length ? (fading ? 1 : 0) : 0,
            transition: 'opacity 4000ms ease-in-out',
          }}
          draggable={false}
        />
      ))}
    </div>
  );
}

// ── Rain ──────────────────────────────────────────────────────────────────────
// Pexels: rainy window, rain on glass
const RAIN_VIDEOS = [
  'https://videos.pexels.com/video-files/856901/856901-sd_640_360_25fps.mp4',
  'https://videos.pexels.com/video-files/4873466/4873466-sd_640_360_30fps.mp4',
];

function RainDrops() {
  const drops = useMemo(() => Array.from({ length: 75 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2.2,
    duration: 1.1 + Math.random() * 0.9,
    opacity: 0.28 + Math.random() * 0.42,
    width: 1 + Math.random() * 0.8,
    height: 14 + Math.random() * 18,
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#04060e 0%,#07091a 55%,#050812 100%)' }}>
      {drops.map(d => (
        <div key={d.id} className="absolute" style={{
          left: `${d.left}%`, top: `-${d.height}px`,
          width: `${d.width}px`, height: `${d.height}px`,
          background: `rgba(148,190,255,${d.opacity})`,
          borderRadius: '1px',
          animationName: 'rainFall',
          animationDuration: `${d.duration}s`,
          animationDelay: `${d.delay}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        }} />
      ))}
      <div className="absolute inset-0 bg-blue-950/15" />
    </div>
  );
}

function RainBg() {
  return (
    <VideoBg
      sources={RAIN_VIDEOS}
      fallback={<RainDrops />}
      tint="rgba(2,4,16,0.45)"
    />
  );
}

// ── Dawn ──────────────────────────────────────────────────────────────────────
// Pexels: sunrise, dawn sky
const DAWN_VIDEOS = [
  'https://videos.pexels.com/video-files/4069367/4069367-sd_640_360_30fps.mp4',
  'https://videos.pexels.com/video-files/1580500/1580500-sd_640_360_24fps.mp4',
];

function DawnGradient() {
  return (
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(135deg,#0a0514 0%,#180928 20%,#2a1350 38%,#60286a 56%,#9e4b55 74%,#c97860 100%)',
      backgroundSize: '400% 400%',
      animationName: 'dawnShift',
      animationDuration: '26s',
      animationTimingFunction: 'ease-in-out',
      animationIterationCount: 'infinite',
    }} />
  );
}

function DawnBg() {
  return (
    <VideoBg
      sources={DAWN_VIDEOS}
      fallback={<DawnGradient />}
      tint="rgba(10,4,18,0.32)"
    />
  );
}

// ── Clouds ────────────────────────────────────────────────────────────────────
// Pexels: clouds timelapse
const CLOUDS_VIDEOS = [
  'https://videos.pexels.com/video-files/4434161/4434161-sd_640_360_25fps.mp4',
  'https://videos.pexels.com/video-files/3571244/3571244-sd_640_360_30fps.mp4',
];

function CloudsCSS() {
  const clouds = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    id: i,
    top: 8 + i * 11,
    width: 180 + i * 55,
    height: 55 + i * 18,
    duration: 48 + i * 14,
    delay: -i * 7,
    opacity: 0.055 + i * 0.012,
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#04070f 0%,#090f1e 45%,#0b1220 100%)' }}>
      {clouds.map(c => (
        <div key={c.id} className="absolute rounded-full" style={{
          top: `${c.top}%`, left: '-320px',
          width: `${c.width}px`, height: `${c.height}px`,
          background: `rgba(170,195,255,${c.opacity})`,
          filter: 'blur(28px)',
          animationName: 'cloudDrift',
          animationDuration: `${c.duration}s`,
          animationDelay: `${c.delay}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        }} />
      ))}
    </div>
  );
}

function CloudsBg() {
  return (
    <VideoBg
      sources={CLOUDS_VIDEOS}
      fallback={<CloudsCSS />}
      tint="rgba(4,7,15,0.50)"
    />
  );
}

// ── City ──────────────────────────────────────────────────────────────────────
// Pexels: city timelapse, city lights at night
const CITY_VIDEOS = [
  'https://videos.pexels.com/video-files/3251099/3251099-sd_640_360_30fps.mp4',
  'https://videos.pexels.com/video-files/2519660/2519660-sd_640_360_30fps.mp4',
];

function CityBokeh() {
  const orbs = useMemo(() => {
    const colors = [
      'rgba(255,195,85', 'rgba(90,140,255', 'rgba(255,90,140',
      'rgba(80,255,190', 'rgba(200,90,255', 'rgba(255,150,60',
    ];
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: (i * 17 + 5) % 97,
      y: (i * 23 + 8) % 88,
      size: 45 + (i * 19) % 110,
      opacity: 0.14 + (i % 5) * 0.044,
      duration: 4.5 + (i % 6) * 0.9,
      delay: (i % 9) * 0.5,
      color: colors[i % colors.length],
    }));
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#02020a' }}>
      {orbs.map(o => (
        <div key={o.id} className="absolute rounded-full" style={{
          left: `${o.x}%`, top: `${o.y}%`,
          width: `${o.size}px`, height: `${o.size}px`,
          background: `${o.color},${o.opacity})`,
          filter: `blur(${o.size * 0.42}px)`,
          transform: 'translate(-50%,-50%)',
          animationName: 'bokehPulse',
          animationDuration: `${o.duration}s`,
          animationDelay: `${o.delay}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
        }} />
      ))}
      <div className="absolute inset-0 bg-black/48" />
    </div>
  );
}

function CityBg() {
  return (
    <VideoBg
      sources={CITY_VIDEOS}
      fallback={<CityBokeh />}
      tint="rgba(2,2,10,0.40)"
    />
  );
}

// ── Night stars overlay (for image-only night fallback) ───────────────────────
function NightStars() {
  const stars = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: (i * 37 + 3) % 99,
    top: (i * 29 + 7) % 65,
    size: 1 + (i % 3) * 0.6,
    duration: 2.5 + (i % 7) * 0.57,
    delay: (i % 9) * 0.56,
  })), []);
  return (
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
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BackgroundLayer({ atmosphere }: Props) {
  // CSS/procedural-only atmospheres (now upgraded to video-first)
  if (atmosphere.id === 'rain')   return <RainBg />;
  if (atmosphere.id === 'dawn')   return <DawnBg />;
  if (atmosphere.id === 'clouds') return <CloudsBg />;
  if (atmosphere.id === 'city')   return <CityBg />;

  // Ocean: video + crossfade image slideshow fallback
  if (atmosphere.id === 'ocean') {
    return (
      <VideoBg
        sources={OCEAN_VIDEOS}
        fallback={<OceanSlideshow />}
        tint="rgba(0,8,42,0.36)"
      />
    );
  }

  // Forest: video + crossfade image slideshow fallback
  if (atmosphere.id === 'forest') {
    return (
      <VideoBg
        sources={FOREST_VIDEOS}
        fallback={<ForestSlideshow />}
        tint="rgba(0,18,8,0.40)"
      />
    );
  }

  // Fire: video + multi-image fallback with flicker
  if (atmosphere.id === 'fire') {
    return (
      <VideoBg
        sources={FIRE_VIDEOS}
        fallback={<FireFallback />}
        tint="rgba(22,4,0,0.28)"
        flicker
      />
    );
  }

  // Night: video + crossfade image slideshow fallback + star twinkle overlay
  if (atmosphere.id === 'night') {
    return (
      <div className="absolute inset-0">
        <VideoBg
          sources={NIGHT_VIDEOS}
          fallback={<NightSlideshow />}
          tint="rgba(0,0,18,0.38)"
        />
        <NightStars />
      </div>
    );
  }

  // Generic image fallback (shouldn't reach here with current atmospheres)
  return (
    <div className="absolute inset-0">
      {atmosphere.bgImage && (
        <img src={atmosphere.bgImage} alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0" style={{ background: atmosphere.tint }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.52) 100%)',
      }} />
    </div>
  );
}
