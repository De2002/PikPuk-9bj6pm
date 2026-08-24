import { fetchActiveTrack } from './api';

// ── Active track URL cache ────────────────────────────────────────────────────
let cachedUrl: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;
let fetchPromise: Promise<string | null> | null = null;

async function getTrackUrl(): Promise<string | null> {
  const now = Date.now();
  if (cachedUrl && now - cachedAt < CACHE_TTL_MS) return cachedUrl;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const track = await fetchActiveTrack();
      fetchPromise = null;
      if (track?.public_url) {
        cachedUrl = track.public_url;
        cachedAt = Date.now();
        return cachedUrl;
      }
    } catch (e) {
      fetchPromise = null;
      console.warn('[audioEngine] getTrackUrl error:', e);
    }
    return null;
  })();

  return fetchPromise;
}

export function invalidateTrackCache() {
  cachedUrl = null;
  cachedAt = 0;
  fetchPromise = null;
}

if (typeof window !== 'undefined') {
  const prefetch = () => { void getTrackUrl(); };
  if (document.readyState === 'complete') {
    setTimeout(prefetch, 800);
  } else {
    window.addEventListener('load', () => setTimeout(prefetch, 800), { once: true });
  }
}

class ScruttinAudioEngine {
  private musicEl: HTMLAudioElement | null = null;
  private musicLoading = false;

  private _volume = 0.5;
  private _playing = false;
  private _ducked = false;
  private _duckRatio = 0.28; // music plays at 28% of its normal volume when voice plays

  get isPlaying() { return this._playing; }
  get volume() { return this._volume; }

  private async ensureMusicEl(): Promise<HTMLAudioElement | null> {
    if (this.musicEl) return this.musicEl;
    if (this.musicLoading) return null;
    this.musicLoading = true;
    const url = await getTrackUrl();
    this.musicLoading = false;
    if (!url) return null;
    const el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    el.volume = this._volume;
    el.crossOrigin = 'anonymous';
    el.src = url;
    this.musicEl = el;
    return el;
  }

  private async startMusic() {
    let el = this.musicEl;
    if (!el) el = await this.ensureMusicEl();
    if (!el) return;
    el.volume = this._ducked ? this._volume * this._duckRatio : this._volume;
    if (el.paused) {
      try { await el.play(); }
      catch (e) { console.warn('[audioEngine] play() blocked:', e); }
    }
  }

  private stopMusic() {
    if (!this.musicEl) return;
    this.musicEl.pause();
  }

  async reload() {
    invalidateTrackCache();
    const wasPlaying = this._playing;
    if (this.musicEl) {
      this.musicEl.pause();
      this.musicEl = null;
    }
    this.musicLoading = false;
    if (wasPlaying) {
      this._playing = true;
      void this.startMusic();
    }
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.musicEl) {
      this.musicEl.volume = this._ducked
        ? this._volume * this._duckRatio
        : this._volume;
    }
  }

  /** Duck the background music while a voice note plays */
  duck() {
    if (this._ducked) return;
    this._ducked = true;
    if (this.musicEl) {
      // Smooth fade down over 600ms
      const target = this._volume * this._duckRatio;
      this._fadeTo(this.musicEl, target, 600);
    }
  }

  /** Restore background music volume after voice note ends */
  unduck() {
    if (!this._ducked) return;
    this._ducked = false;
    if (this.musicEl) {
      this._fadeTo(this.musicEl, this._volume, 900);
    }
  }

  private _fadeTo(el: HTMLAudioElement, targetVol: number, durationMs: number) {
    const startVol = el.volume;
    const startTime = performance.now();
    const step = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const ease = 1 - Math.pow(1 - t, 2);
      el.volume = startVol + (targetVol - startVol) * ease;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  play() {
    this._playing = true;
    void this.startMusic();
  }

  pause() {
    this._playing = false;
    this.stopMusic();
  }

  toggle() {
    if (this._playing) this.pause();
    else this.play();
  }
}

export const audioEngine = new ScruttinAudioEngine();
