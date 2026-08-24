export type MomentType = 'dream' | 'thought';
export type StreamPhase = 'gap' | 'entering' | 'reading' | 'leaving';
export type AudioMode = 'calm' | 'rain' | 'night' | 'nature' | 'piano' | 'hopeful' | 'none';
export type AtmosphereId = 'night' | 'ocean' | 'forest' | 'fire' | 'rain' | 'dawn' | 'clouds' | 'city';
export type BgStyle = 'image' | 'rain' | 'dawn' | 'clouds' | 'city';
export type TextSize = 'sm' | 'md' | 'lg';
export type DisplayId = 'float' | 'film' | 'carousel' | 'duster';

export const SPACES = [
  { id: 'general',   label: 'General' },
  { id: 'tech',      label: 'Tech' },
  { id: 'life',      label: 'Life' },
  { id: 'art',       label: 'Art' },
  { id: 'science',   label: 'Science' },
  { id: 'music',     label: 'Music' },
  { id: 'food',      label: 'Food' },
  { id: 'travel',    label: 'Travel' },
  { id: 'health',    label: 'Health' },
  { id: 'nature',    label: 'Nature' },
  { id: 'business',  label: 'Business' },
  { id: 'education', label: 'Education' },
] as const;

export type SpaceId = typeof SPACES[number]['id'];

export interface Moment {
  id: string;
  type: MomentType;
  body: string;
  title?: string;
  authorName?: string;
  websiteUrl?: string;
  space: SpaceId;
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
