import { createContext, useContext } from 'react';
import type { CityRef } from './types';
import type { Prefs } from './store';

export interface Store {
  cities: CityRef[];
  citySlug: string;
  setCity: (slug: string) => void;
  cityName: string;
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
}

export const StoreContext = createContext<Store>(null as unknown as Store);

export const useStore = () => useContext(StoreContext);
