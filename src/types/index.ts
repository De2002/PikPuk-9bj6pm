export type MomentType = 'dream' | 'thought';
export type StreamPhase = 'gap' | 'entering' | 'reading' | 'leaving';
export type AudioMode = 'calm' | 'rain' | 'night' | 'nature' | 'piano' | 'hopeful' | 'none';
export type AtmosphereId = 'night' | 'ocean' | 'forest' | 'fire' | 'rain' | 'dawn' | 'clouds' | 'city';
export type BgStyle = 'image' | 'rain' | 'dawn' | 'clouds' | 'city';
export type TextSize = 'sm' | 'md' | 'lg';
export type DisplayId = 'float' | 'film' | 'carousel' | 'duster';

export interface Moment {
  id: string;
  type: MomentType;
  body: string;
  polaroidUrl?: string;
  audioUrl?: string;
  avatarUrl: string;
}

export interface Atmosphere {
  id: AtmosphereId;
  name: string;
  bgImage?: string;
  bgStyle: BgStyle;
  audioMode: AudioMode;
  tint: string;
}

export interface UserSettings {
  defaultAtmosphere: AtmosphereId;
  volume: number;
  textSize: TextSize;
  enableVoiceAudio: boolean;
  autoPlayVoice: boolean;
}

export interface User {
  id: string;
  email: string;
  avatarUrl?: string;
  isAdmin: boolean;
  settings: UserSettings;
}
