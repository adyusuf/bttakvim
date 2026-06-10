import { Article as ArticleIcon, MagnifyingGlass } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBlogPosts } from '../lib/api';
import { catColor } from './Kapak';
import type { BlogPostRef } from '../lib/types';

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState<BlogPostRef[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      fetchBlogPosts().then(setPosts).catch(() => setPosts([]));
      setTimeout(() => inputRef.current?.focus(), 30);
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const ql = q.trim().toLocaleLowerCase('tr');
  const res = useMemo(
    () => (ql ? posts.filter((p) => (p.title + ' ' + p.summary + ' ' + p.categoryName).toLocaleLowerCase('tr').includes(ql)) : []),
    [posts, ql],
  );
  const populer = posts.slice(0, 4);

  if (!open) return null;
  const go = (slug: string) => { onClose(); nav(`/yazi/${slug}`); };

  return (
    <div className="web-search-ov" onMouseDown={onClose}>
      <div className="web-search-box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="web-search-field">
          <MagnifyingGlass size={20} color="var(--text-muted)" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Konu, şehir ya da kişi ara…" />
          <button className="web-search-esc" onClick={onClose}>Esc</button>
        </div>
        <div className="web-search-body">
          <div className="web-search-lbl">{ql ? `${res.length} sonuç` : 'Popüler'}</div>
          {(ql ? res : populer).map((y) => (
            <button key={y.slug} className="web-search-res" onClick={() => go(y.slug)}>
              <ArticleIcon size={17} color={catColor(y.categorySlug)} />
              <span className="web-search-res-t">{y.title}</span>
              <span className="web-search-res-k">{y.categoryName}</span>
            </button>
          ))}
          {ql && res.length === 0 ? <div className="web-search-empty">Sonuç bulunamadı.</div> : null}
        </div>
      </div>
    </div>
  );
}
