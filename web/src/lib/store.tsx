/** Paylaşılan durum: şehir, şehir listesi, palet/Tweaks tercihleri. */
import { useCallback, useEffect, useState } from 'react';
import { fetchCities } from './api';
import type { CityRef } from './types';
import { StoreContext, DEFAULT_PRAYER_PREFS } from './store-context';

export interface Prefs {
  paletteId: string;
  frame: 'sade' | 'cizgi' | 'altin';
  dome: boolean;
  medallion: boolean;
}

const DEFAULT_PREFS: Prefs = { paletteId: 'osmanli', frame: 'altin', dome: true, medallion: true };

export interface PrayerTune {
  imsak: number;
  gunes: number;
  ogle: number;
  ikindi: number;
  aksam: number;
  yatsi: number;
}

export interface PrayerPrefs {
  method: number;     // default 13 (Diyanet)
  school: 0 | 1;      // 0 = Şâfiî/standart, 1 = Hanefî (Asr)
  tune: PrayerTune;
}

/** Partial güncelleme; tune ayrı ayrı vakitler için kısmî olabilir. */
export type PrayerPrefsPatch = Partial<Omit<PrayerPrefs, 'tune'>> & { tune?: Partial<PrayerTune> };

function loadPrayerPrefs(): PrayerPrefs {
  const fallback = (): PrayerPrefs => ({ ...DEFAULT_PRAYER_PREFS, tune: { ...DEFAULT_PRAYER_PREFS.tune } });
  try {
    const raw = localStorage.getItem('btw_prayer');
    if (!raw) return fallback();
    const parsed = JSON.parse(raw) as Partial<PrayerPrefs>;
    return {
      ...DEFAULT_PRAYER_PREFS,
      ...parsed,
      tune: { ...DEFAULT_PRAYER_PREFS.tune, ...(parsed.tune ?? {}) },
    };
  } catch {
    return fallback();
  }
}

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
  const [prayerPrefs, setPrayerPrefsState] = useState<PrayerPrefs>(loadPrayerPrefs);

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

  const setPrayerPrefs = useCallback((p: PrayerPrefsPatch) => {
    setPrayerPrefsState((prev) => {
      const next: PrayerPrefs = {
        ...prev,
        ...p,
        tune: { ...prev.tune, ...(p.tune ?? {}) },
      };
      localStorage.setItem('btw_prayer', JSON.stringify(next));
      return next;
    });
  }, []);

  const cityName = cities.find((c) => c.slug === citySlug)?.name ?? 'İstanbul';

  return (
    <StoreContext.Provider value={{ cities, citySlug, setCity, cityName, prefs, setPrefs, prayerPrefs, setPrayerPrefs }}>
      {children}
    </StoreContext.Provider>
  );
}
