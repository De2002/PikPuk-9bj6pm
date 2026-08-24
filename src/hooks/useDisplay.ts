import { useState, useCallback } from 'react';
import { DisplayId } from '@/types';

const KEY = 'scruttin_display';
const DEFAULT: DisplayId = 'float';

function load(): DisplayId {
  try { return (localStorage.getItem(KEY) as DisplayId) || DEFAULT; } catch { return DEFAULT; }
}

export function useDisplay() {
  const [displayId, setDisplayId] = useState<DisplayId>(load);

  const setDisplay = useCallback((id: DisplayId) => {
    setDisplayId(id);
    try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
  }, []);

  return { displayId, setDisplay };
}
