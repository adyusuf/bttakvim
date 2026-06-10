import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { MOCK_CITIES, mockLeaf, mockPrayerTimes } from './mock';
import type { BlogCategoryRef, BlogPost, BlogPostRef, CityRef, Leaf, PrayerTimes } from './types';

/**
 * API adresi: EXPO_PUBLIC_API_URL verilmişse o; yoksa Metro'nun çalıştığı
 * makinenin IP'si (fiziksel cihazda da çalışsın diye) + backend portu 5210.
 */
function resolveApiBase(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  const hostUri: string | undefined =
    (Constants.expoConfig as any)?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0] || 'localhost';
  return `http://${host}:5210`;
}

export const API_BASE = resolveApiBase();

async function get<T>(path: string, timeoutMs = 6000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export interface LeafResult {
  leaf: Leaf;
  offline: boolean;
}

export async function fetchLeaf(dateIso: string): Promise<LeafResult> {
  try {
    const leaf = await get<Leaf>(`/api/leaves/${dateIso}`);
    return { leaf, offline: false };
  } catch {
    return { leaf: mockLeaf(dateIso), offline: true };
  }
}

export async function fetchPrayerTimes(
  dateIso: string,
  location: { citySlug?: string; lat?: number; lng?: number },
): Promise<PrayerTimes> {
  const params = new URLSearchParams({ date: dateIso });
  if (location.citySlug) params.set('city', location.citySlug);
  else if (location.lat != null && location.lng != null) {
    params.set('lat', String(location.lat));
    params.set('lng', String(location.lng));
  }
  try {
    return await get<PrayerTimes>(`/api/prayer-times?${params.toString()}`);
  } catch {
    return mockPrayerTimes(dateIso);
  }
}

export async function fetchCities(): Promise<CityRef[]> {
  try {
    return await get<CityRef[]>('/api/prayer-times/cities');
  } catch {
    return MOCK_CITIES;
  }
}

// ---- Blog ----

export async function fetchBlogPosts(category?: string): Promise<BlogPostRef[]> {
  try {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    return await get<BlogPostRef[]>(`/api/blog${qs}`);
  } catch {
    return [];
  }
}

export async function fetchBlogCategories(): Promise<BlogCategoryRef[]> {
  try {
    return await get<BlogCategoryRef[]>('/api/blog/categories');
  } catch {
    return [];
  }
}

export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    return await get<BlogPost>(`/api/blog/${slug}`);
  } catch {
    return null;
  }
}

// ---- Cihaz kimliği (beğeni/kaydet/yorum için anonim anahtar) ----

const DEVICE_KEY_STORAGE = 'bttakvim:device-key';

export async function getDeviceKey(): Promise<string> {
  let key = await AsyncStorage.getItem(DEVICE_KEY_STORAGE);
  if (!key) {
    key = `dev-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    await AsyncStorage.setItem(DEVICE_KEY_STORAGE, key);
  }
  return key;
}

// ---- Şehir tercihi ----

const CITY_STORAGE = 'bttakvim:city';

export async function getSavedCity(): Promise<string | null> {
  return AsyncStorage.getItem(CITY_STORAGE);
}

export async function saveCity(slug: string): Promise<void> {
  await AsyncStorage.setItem(CITY_STORAGE, slug);
}
