import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calcReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const wpm = 190;
  const readMs = Math.ceil((words / wpm) * 60000);
  const base = 3000;
  const buffer = 2200;
  return Math.min(Math.max(base + readMs + buffer, 6500), 22000);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getPolaroidRotation(id: string): number {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const angles = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
  return angles[hash % angles.length];
}

export function makeId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}
