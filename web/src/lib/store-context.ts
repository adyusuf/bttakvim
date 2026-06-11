import { createContext, useContext } from 'react';
import type { CityRef } from './types';
import type { Prefs, PrayerPrefs, PrayerPrefsPatch } from './store';

export interface Store {
  cities: CityRef[];
  citySlug: string;
  setCity: (slug: string) => void;
  cityName: string;
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  prayerPrefs: PrayerPrefs;
  setPrayerPrefs: (p: PrayerPrefsPatch) => void;
}

/** Namaz hesap tercihleri varsayılanı: Diyanet (method 13), standart Asr, temkin yok. */
export const DEFAULT_PRAYER_PREFS: PrayerPrefs = {
  method: 13,
  school: 0,
  tune: { imsak: 0, gunes: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0 },
};

export const StoreContext = createContext<Store>(null as unknown as Store);

export const useStore = () => useContext(StoreContext);
