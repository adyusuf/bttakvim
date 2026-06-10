/** Paylaşılan durum: şehir, şehir listesi, palet/Tweaks tercihleri. */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchCities } from './api';
import type { CityRef } from './types';

export interface Prefs {
  paletteId: string;
  frame: 'sade' | 'cizgi' | 'altin';
  dome: boolean;
  medallion: boolean;
}

const DEFAULT_PREFS: Prefs = { paletteId: 'osmanli', frame: 'altin', dome: true, medallion: true };

interface Store {
  cities: CityRef[];
  citySlug: string;
  setCity: (slug: string) => void;
  cityName: string;
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
}

const Ctx = createContext<Store>(null as unknown as Store);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cities, setCities] = useState<CityRef[]>([]);
  const [citySlug, setCitySlug] = useState(() => localStorage.getItem('btw_city') ?? 'istanbul');
  const [prefs, setPrefsState] = useState<Prefs>(() => {
    try {
      const raw = localStorage.getItem('btw_prefs');
      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  useEffect(() => {
    fetchCities().then(setCities).catch(() => setCities([
      { slug: 'istanbul', name: 'İstanbul' }, { slug: 'ankara', name: 'Ankara' }, { slug: 'izmir', name: 'İzmir' },
    ]));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.palette = prefs.paletteId;
    document.documentElement.dataset.btFrame = prefs.frame;
    document.documentElement.dataset.btDome = prefs.dome ? 'on' : 'off';
    document.documentElement.dataset.btMedallion = prefs.medallion ? 'on' : 'off';
  }, [prefs]);

  const setCity = useCallback((slug: string) => {
    setCitySlug(slug);
    localStorage.setItem('btw_city', slug);
  }, []);

  const setPrefs = useCallback((p: Partial<Prefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...p };
      localStorage.setItem('btw_prefs', JSON.stringify(next));
      return next;
    });
  }, []);

  const cityName = cities.find((c) => c.slug === citySlug)?.name ?? 'İstanbul';

  return (
    <Ctx.Provider value={{ cities, citySlug, setCity, cityName, prefs, setPrefs }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
