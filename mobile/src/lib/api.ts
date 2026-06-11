import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { MOCK_CITIES, mockLeaf, mockPrayerTimes } from './mock';
import type {
  BlogCategoryRef, BlogPost, BlogPostRef, CityRef, Comment, ForumTopic, ForumTopicRef,
  Leaf, PrayerTimes, ReactionKind, ReactionStatus, TargetType,
} from './types';

/** Üretim (yayınlanan derleme) backend adresi. */
const PROD_API_URL = 'https://testapi.batitrakyatakvimi.com';

/**
 * API adresi seçimi:
 *  1. EXPO_PUBLIC_API_URL verilmişse her zaman o (override).
 *  2. Üretim derlemesinde (__DEV__ false) PROD_API_URL.
 *  3. Geliştirmede Metro'nun çalıştığı makinenin IP'si + :5210
 *     (fiziksel cihazda yerel backend'e ulaşmak için).
 */
function resolveApiBase(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  if (!__DEV__) return PROD_API_URL;
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

async function post<T>(path: string, body: unknown, timeoutMs = 6000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* yoksay */ }
      throw new Error(msg);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
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
  prefs?: PrayerPrefs,
): Promise<PrayerTimes> {
  const params = new URLSearchParams({ date: dateIso });
  if (location.citySlug) params.set('city', location.citySlug);
  else if (location.lat != null && location.lng != null) {
    params.set('lat', String(location.lat));
    params.set('lng', String(location.lng));
  }
  if (prefs) {
    params.set('method', String(prefs.method));
    params.set('school', String(prefs.school));
    const t = prefs.tune;
    params.set('tune', [t.imsak, t.gunes, t.ogle, t.ikindi, t.aksam, t.yatsi].join(','));
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

// ---- Yorumlar ----

export const fetchComments = (targetType: TargetType, targetId: number) =>
  get<Comment[]>(`/api/comments?targetType=${targetType}&targetId=${targetId}`);

export const postComment = (body: {
  targetType: TargetType; targetId: number; parentId?: number | null;
  authorName: string; deviceKey: string; body: string;
}) => post<Comment>('/api/comments', body);

// ---- Tepkiler ----

export const toggleReaction = (
  targetType: TargetType, targetId: number, kind: ReactionKind, deviceKey: string,
) => post<{ active: boolean; count: number }>('/api/reactions/toggle', { targetType, targetId, kind, deviceKey });

export const fetchReactionStatus = (targetType: TargetType, targetId: number, deviceKey: string) =>
  get<ReactionStatus>(`/api/reactions/status?targetType=${targetType}&targetId=${targetId}&deviceKey=${encodeURIComponent(deviceKey)}`);

// ---- Forum ----

export const fetchForumTopics = () => get<ForumTopicRef[]>('/api/forum/topics');
export const fetchForumTopic = (id: number) => get<ForumTopic>(`/api/forum/topics/${id}`);
export const createForumTopic = (body: { title: string; body: string; authorName: string; deviceKey: string }) =>
  post<{ id: number }>('/api/forum/topics', body);

// ---- Cihaz kimliği (beğeni/kaydet/yorum için anonim anahtar) ----

const DEVICE_KEY_STORAGE = 'bttakvim:device-key';

// Tek uçuş (in-flight) söz: birden çok bileşen aynı anda çağırınca aynı anahtarı alsın.
let deviceKeyPromise: Promise<string> | null = null;

export function getDeviceKey(): Promise<string> {
  deviceKeyPromise ??= (async () => {
    let key = await AsyncStorage.getItem(DEVICE_KEY_STORAGE);
    if (!key) {
      key = `dev-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      await AsyncStorage.setItem(DEVICE_KEY_STORAGE, key);
    }
    return key;
  })();
  return deviceKeyPromise;
}

// ---- Yazar adı (yorum için, hatırlanır) ----

const AUTHOR_STORAGE = 'bttakvim:author';
export const getSavedAuthor = () => AsyncStorage.getItem(AUTHOR_STORAGE);
export const saveAuthor = (name: string) => AsyncStorage.setItem(AUTHOR_STORAGE, name);

// ---- Şehir tercihi ----

const CITY_STORAGE = 'bttakvim:city';

export async function getSavedCity(): Promise<string | null> {
  return AsyncStorage.getItem(CITY_STORAGE);
}

export async function saveCity(slug: string): Promise<void> {
  await AsyncStorage.setItem(CITY_STORAGE, slug);
}

// ---- Namaz vakti hesaplama tercihleri ----
//
// Paylaşılan sözleşme (backend + web aynısını uygular):
//   method=<int>&school=<0|1>&tune=<imsak,gunes,ogle,ikindi,aksam,yatsi>
// Varsayılan: method 13 (Diyanet), school 0 (standart Asr), tüm tune 0 —
// yani değişiklik yapmayan kullanıcı için bugünkü davranış birebir korunur.

export interface PrayerTune {
  imsak: number;
  gunes: number;
  ogle: number;
  ikindi: number;
  aksam: number;
  yatsi: number;
}

export interface PrayerPrefs {
  method: number; // varsayılan 13 (Diyanet)
  school: 0 | 1; // 0 = Şâfiî/standart, 1 = Hanefî (Asr)
  tune: PrayerTune; // her vakit için dakika ince ayarı (temkin), -30..+30
}

const PRAYER_PREFS_STORAGE = 'bttakvim:prayer-prefs';

export const DEFAULT_PRAYER_TUNE: PrayerTune = {
  imsak: 0,
  gunes: 0,
  ogle: 0,
  ikindi: 0,
  aksam: 0,
  yatsi: 0,
};

export const DEFAULT_PRAYER_PREFS: PrayerPrefs = {
  method: 13,
  school: 0,
  tune: { ...DEFAULT_PRAYER_TUNE },
};

export async function getPrayerPrefs(): Promise<PrayerPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_PREFS_STORAGE);
    if (!raw) return { ...DEFAULT_PRAYER_PREFS, tune: { ...DEFAULT_PRAYER_TUNE } };
    const parsed = JSON.parse(raw) as Partial<PrayerPrefs>;
    return {
      method: typeof parsed.method === 'number' ? parsed.method : DEFAULT_PRAYER_PREFS.method,
      school: parsed.school === 1 ? 1 : 0,
      // tune derin birleştirme: eksik alanlar varsayılan 0 ile tamamlanır.
      tune: { ...DEFAULT_PRAYER_TUNE, ...(parsed.tune ?? {}) },
    };
  } catch {
    return { ...DEFAULT_PRAYER_PREFS, tune: { ...DEFAULT_PRAYER_TUNE } };
  }
}

export async function savePrayerPrefs(p: PrayerPrefs): Promise<void> {
  await AsyncStorage.setItem(PRAYER_PREFS_STORAGE, JSON.stringify(p));
}
