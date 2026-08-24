import { Atmosphere, AtmosphereId } from '@/types';
import bgNight from '@/assets/bg-night.jpg';
import bgOcean from '@/assets/bg-ocean.jpg';
import bgForest from '@/assets/bg-forest.jpg';
import bgFire from '@/assets/bg-fire.jpg';

export const ATMOSPHERES: Atmosphere[] = [
  {
    id: 'night',
    name: 'Night Sky',
    bgImage: bgNight,
    bgStyle: 'image',
    audioMode: 'night',
    tint: 'rgba(0,0,18,0.38)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    bgImage: bgOcean,
    bgStyle: 'image',
    audioMode: 'calm',
    tint: 'rgba(0,8,38,0.42)',
  },
  {
    id: 'forest',
    name: 'Forest',
    bgImage: bgForest,
    bgStyle: 'image',
    audioMode: 'nature',
    tint: 'rgba(0,18,8,0.46)',
  },
  {
    id: 'fire',
    name: 'Fireplace',
    bgImage: bgFire,
    bgStyle: 'image',
    audioMode: 'hopeful',
    tint: 'rgba(25,4,0,0.30)',
  },
  {
    id: 'rain',
    name: 'Rain',
    bgStyle: 'rain',
    audioMode: 'rain',
    tint: '',
  },
  {
    id: 'dawn',
    name: 'Dawn',
    bgStyle: 'dawn',
    audioMode: 'calm',
    tint: '',
  },
  {
    id: 'clouds',
    name: 'Clouds',
    bgStyle: 'clouds',
    audioMode: 'calm',
    tint: '',
  },
  {
    id: 'city',
    name: 'City Night',
    bgStyle: 'city',
    audioMode: 'night',
    tint: '',
  },
];

export const getAtmosphere = (id: string): Atmosphere =>
  ATMOSPHERES.find(a => a.id === id) ?? ATMOSPHERES[0];

export const DEFAULT_ATMOSPHERE_ID: AtmosphereId = 'night';
