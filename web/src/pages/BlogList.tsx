import { Clock, SquaresFour } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Kapak, catColor } from '../components/Kapak';
import { LeafAside } from '../components/LeafAside';
import { Rosette } from '../components/leaf-bits';
import { fetchBlogCategories, fetchBlogPosts } from '../lib/api';
import { formatLongDate } from '../lib/dates';
import type { BlogCategoryRef, BlogPostRef } from '../lib/types';

function Meta({ post, sm }: { post: BlogPostRef; sm?: boolean }) {
  return (
    <div className={'web-meta' + (sm ? ' sm' : '')}>
      {!sm ? <><span className="web-byline">BTTakvim Kültür Servisi</span><span className="web-dot">·</span></> : null}
      <span>{formatLongDate(post.publishedAtUtc.slice(0, 10))}</span>
      <span className="web-dot">·</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <Clock size={sm ? 12 : 13} color="var(--text-faint)" />{post.readingMinutes} dk
      </span>
    </div>
  );
}

function Featured({ post, onOpen }: { post: BlogPostRef; onOpen: (s: string) => void }) {
  return (
    <button className="web-featured" onClick={() => onOpen(post.slug)}>
      <div className="web-featured-media">
        <Kapak post={post} h={340} iconSize={84} />
        <span className="web-featured-badge">Öne Çıkan</span>
      </div>
      <div className="web-featured-body">
        <span className="web-label" style={{ fontSize: 11, color: catColor(post.categorySlug) }}>{post.categoryName}</span>
        <h2 className="web-featured-title">{post.title}</h2>
        <p className="web-featured-dek">{post.summary}</p>
        <Meta post={post} />
      </div>
    </button>
  );
}

function Card({ post, onOpen }: { post: BlogPostRef; onOpen: (s: string) => void }) {
  return (
    <button className="web-card" onClick={() => onOpen(post.slug)}>
      <div className="web-card-media"><Kapak post={post} h={168} iconSize={46} /></div>
      <div className="web-card-body">
        <span className="web-label" style={{ fontSize: 10, color: catColor(post.categorySlug) }}>{post.categoryName}</span>
        <h3 className="web-card-title">{post.title}</h3>
        <p className="web-card-dek">{post.summary}</p>
        <Meta post={post} sm />
      </div>
    </button>
  );
}

export function BlogList() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const kategori = params.get('kategori');
  const [posts, setPosts] = useState<BlogPostRef[]>([]);
  const [categories, setCategories] = useState<BlogCategoryRef[]>([]);

  useEffect(() => {
    fetchBlogPosts().then(setPosts).catch(() => setPosts([]));
    fetchBlogCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const filtered = useMemo(
    () => (kategori ? posts.filter((p) => p.categorySlug === kategori) : posts),
    [posts, kategori],
  );
  const featured = !kategori ? filtered[0] : undefined;
  const liste = featured ? filtered.slice(1) : filtered;

  const openArticle = (slug: string) => nav(`/yazi/${slug}`);
  const pickCat = (slug: string | null) => setParams(slug ? { kategori: slug } : {});

  return (
    <main className="web-container web-layout">
      <div className="web-layout-main">
        <div className="web-masthead">
          <div className="web-eyebrow">
            <Rosette size={26} />
            <span className="web-label" style={{ fontSize: 12, color: 'var(--accent)' }}>Tarih · Gelenek · Kültür</span>
          </div>
          <h1 className="web-masthead-title">Keşfet</h1>
          <p className="web-masthead-sub">Yaprağın ardındaki hikâyeler: tarihî olaylar, şehirler, şahsiyetler ve interaktif haritalar.</p>
        </div>

        <div className="web-catbar">
          <button className={'web-chip' + (!kategori ? ' on' : '')} onClick={() => pickCat(null)}>
            <SquaresFour size={14} weight={!kategori ? 'fill' : 'regular'} /> Tümü
          </button>
          {categories.map((k) => (
            <button key={k.slug} className={'web-chip' + (kategori === k.slug ? ' on' : '')} onClick={() => pickCat(k.slug)}>
              {k.name}
            </button>
          ))}
        </div>

        {featured ? <Featured post={featured} onOpen={openArticle} /> : null}
        <div className="web-grid">
          {liste.map((p) => <Card key={p.slug} post={p} onOpen={openArticle} />)}
        </div>
        {filtered.length === 0 ? <div className="web-empty">Bu kategoride yakında yeni yazılar.</div> : null}
      </div>
      <div className="web-layout-aside"><LeafAside /></div>
    </main>
  );
}
