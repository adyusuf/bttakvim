import { useEffect, useState } from 'react';
import { getDeviceKey } from './api';

/** Anonim cihaz kimliğini (beğeni/kaydet/yorum için) bir kez yükler. */
export function useDeviceKey(): string {
  const [key, setKey] = useState('');
  useEffect(() => {
    getDeviceKey().then(setKey);
  }, []);
  return key;
}
