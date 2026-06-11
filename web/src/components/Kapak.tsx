import {
  BookOpenText, Buildings, CastleTurret, Coffee, Campfire, MapTrifold, UserFocus,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import type { BlogPostRef } from '../lib/types';
import { catColor } from './catColor';

const CAT_ICON: Record<string, PhosphorIcon> = {
  'tarihi-olaylar': CastleTurret,
  sehirler: Buildings,
  'onemli-sahsiyetler': UserFocus,
  haritalar: MapTrifold,
  kultur: Coffee,
  gelenekler: Campfire,
  'faydali-bilgiler': BookOpenText,
};

const FALLBACK_PHOTO: Record<string, string> = {
  sehirler: '/photos/foto-tas-ev-w.jpg',
  haritalar: '/photos/foto-ege-deniz-w.jpg',
  gelenekler: '/photos/foto-ege-koy-w.jpg',
};

export function Kapak({ post, h, iconSize }: { post: BlogPostRef; h: number; iconSize: number }) {
  const Ikon = CAT_ICON[post.categorySlug] ?? BookOpenText;
  const renk = catColor(post.categorySlug);
  const photo = post.coverImageUrl ?? FALLBACK_PHOTO[post.categorySlug];

  if (photo) {
    return (
      <div className="web-kapak" style={{ position: 'relative', height: h, overflow: 'hidden', background: 'var(--paper-2)' }}>
        <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 40%, color-mix(in srgb, ${renk} 55%, transparent))` }} />
      </div>
    );
  }
  return (
    <div className="web-kapak" style={{ position: 'relative', height: h, overflow: 'hidden', background: `color-mix(in srgb, ${renk} 14%, var(--surface-card))` }}>
      <div style={{ position: 'absolute', right: -14, bottom: -22, opacity: 0.17 }}>
        <Ikon size={h * 0.95} weight="fill" color={renk} />
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ikon size={iconSize} weight="fill" color={renk} style={{ opacity: 0.92 }} />
      </div>
    </div>
  );
}
