import type {
  BlogCategoryRef,
  BlogPost,
  BlogPostRef,
  CityRef,
  Comment,
  ForumTopic,
  ForumTopicRef,
  Leaf,
  PrayerTimes,
  ReactionKind,
  ReactionStatus,
  TargetType,
} from './types';

export const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5210').replace(/\/$/, '');

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* yoksay */ }
    throw new Error(msg);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ---- Anonim cihaz kimliği (beğeni/kaydet/yorum için) ----

export function getDeviceKey(): string {
  let key = localStorage.getItem('btw_device');
  if (!key) {
    key = `dev-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem('btw_device', key);
  }
  return key;
}

export function getAuthorName(): string {
  return localStorage.getItem('btw_author') ?? '';
}
export function setAuthorName(name: string) {
  localStorage.setItem('btw_author', name);
}

// ---- Yorumlar ----

export const fetchComments = (targetType: TargetType, targetId: number) =>
  get<Comment[]>(`/api/comments?targetType=${targetType}&targetId=${targetId}`);

export const postComment = (body: {
  targetType: TargetType; targetId: number; parentId?: number | null;
  authorName: string; deviceKey: string; body: string;
}) => post<Comment>('/api/comments', body);

// ---- Tepkiler ----

export const toggleReaction = (targetType: TargetType, targetId: number, kind: ReactionKind, deviceKey: string) =>
  post<{ active: boolean; count: number }>('/api/reactions/toggle', { targetType, targetId, kind, deviceKey });

export const fetchReactionStatus = (targetType: TargetType, targetId: number, deviceKey: string) =>
  get<ReactionStatus>(`/api/reactions/status?targetType=${targetType}&targetId=${targetId}&deviceKey=${encodeURIComponent(deviceKey)}`);

// ---- Forum ----

export const fetchForumTopics = () => get<ForumTopicRef[]>('/api/forum/topics');
export const fetchForumTopic = (id: number) => get<ForumTopic>(`/api/forum/topics/${id}`);
export const createForumTopic = (body: { title: string; body: string; authorName: string; deviceKey: string }) =>
  post<{ id: number }>('/api/forum/topics', body);

export const fetchLeaf = (dateIso: string) => get<Leaf>(`/api/leaves/${dateIso}`);

export function fetchPrayerTimes(dateIso: string, citySlug: string) {
  return get<PrayerTimes>(`/api/prayer-times?date=${dateIso}&city=${encodeURIComponent(citySlug)}`);
}

export const fetchCities = () => get<CityRef[]>('/api/prayer-times/cities');

export function fetchBlogPosts(category?: string) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return get<BlogPostRef[]>(`/api/blog${qs}`);
}

export const fetchBlogCategories = () => get<BlogCategoryRef[]>('/api/blog/categories');
export const fetchBlogPost = (slug: string) => get<BlogPost>(`/api/blog/${slug}`);
