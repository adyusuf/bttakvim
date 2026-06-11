const CAT_COLOR: Record<string, string> = {
  'tarihi-olaylar': 'var(--red-0)',
  sehirler: 'var(--blue-0)',
  'onemli-sahsiyetler': 'var(--gold-0)',
  haritalar: 'var(--blue-1)',
  'faydali-bilgiler': 'var(--green-0)',
};

export function catColor(slug: string) {
  return CAT_COLOR[slug] ?? 'var(--ink-1)';
}
