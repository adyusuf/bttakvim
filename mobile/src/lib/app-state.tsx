/** Sekmeler arası paylaşılan durum: konum (şehir/GPS) ve şehir listesi. */
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { fetchCities, getSavedCity, saveCity } from './api';
import type { CityRef } from './types';

export type LocationMode =
  | { kind: 'city'; slug: string }
  | { kind: 'gps'; lat: number; lng: number };

interface AppState {
  cities: CityRef[];
  location: LocationMode;
  selectCity: (slug: string) => void;
  useGps: () => Promise<void>;
  cityName: string;
}

const Ctx = createContext<AppState>({
  cities: [],
  location: { kind: 'city', slug: 'istanbul' },
  selectCity: () => {},
  useGps: async () => {},
  cityName: 'İstanbul',
});

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [cities, setCities] = useState<CityRef[]>([]);
  const [location, setLocation] = useState<LocationMode>({ kind: 'city', slug: 'istanbul' });

  useEffect(() => {
    (async () => {
      const [saved, list] = await Promise.all([getSavedCity(), fetchCities()]);
      setCities(list);
      if (saved) setLocation({ kind: 'city', slug: saved });
    })();
  }, []);

  const selectCity = useCallback((slug: string) => {
    setLocation({ kind: 'city', slug });
    saveCity(slug);
  }, []);

  const useGps = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Konum izni verilmedi', 'Şehir listesinden seçim yapabilirsiniz.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation({ kind: 'gps', lat: pos.coords.latitude, lng: pos.coords.longitude });
  }, []);

  const cityName =
    location.kind === 'city'
      ? cities.find((c) => c.slug === location.slug)?.name ?? 'İstanbul'
      : 'Konumum';

  return (
    <Ctx.Provider value={{ cities, location, selectCity, useGps, cityName }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppState(): AppState {
  return useContext(Ctx);
}
