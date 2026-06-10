import type {
  BlogCategoryRef,
  BlogPost,
  BlogPostRef,
  CityRef,
  Leaf,
  PrayerTimes,
} from './types';

export const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5210').replace(/\/$/, '');

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

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
