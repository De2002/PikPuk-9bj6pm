import { useState, useCallback } from 'react';
import { Atmosphere, AtmosphereId } from '@/types';
import { getAtmosphere, DEFAULT_ATMOSPHERE_ID } from '@/constants/atmospheres';

const KEY = 'scruttin_atm';

function loadId(): AtmosphereId {
  try {
    return (localStorage.getItem(KEY) as AtmosphereId) || DEFAULT_ATMOSPHERE_ID;
  } catch { return DEFAULT_ATMOSPHERE_ID; }
}

export function useAtmosphere() {
  const [atmosphereId, setAtmosphereId] = useState<AtmosphereId>(loadId);
  const atmosphere: Atmosphere = getAtmosphere(atmosphereId);

  const setAtmosphere = useCallback((id: AtmosphereId) => {
    setAtmosphereId(id);
    try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
  }, []);

  return { atmosphere, atmosphereId, setAtmosphere };
}
