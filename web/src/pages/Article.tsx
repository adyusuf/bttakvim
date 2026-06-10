import { CaretRight, Clock, FacebookLogo, Feather, LinkSimple, WhatsappLogo, XLogo } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DEMO_MAPS, InteractiveMap } from '../components/InteractiveMap';
import { Kapak, catColor } from '../components/Kapak';
import { LeafAside } from '../components/LeafAside';
import { fetchBlogPost, fetchBlogPosts } from '../lib/api';
import { formatLongDate } from '../lib/dates';
import type { BlogPost, BlogPostRef } from '../lib/types';

function ReadingProgress({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = targetRef.current;
      if (!el) return;
      const top = el.offsetTop, h = el.offsetHeight;
      const y = window.scrollY + window.innerHeight * 0.5;
      setPct(Math.max(0, Math.min(1, (y - top) / h)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetRef]);
  return <div className="web-progress"><i style={{ width: `${pct * 100}%` }} /></div>;
}

function ShareRow() {
  const items = [
    { Ikon: LinkSimple, t: 'Bağlantı' }, { Ikon: XLogo, t: 'X' },
    { Ikon: FacebookLogo, t: 'Facebook' }, { Ikon: WhatsappLogo, t: 'WhatsApp' },
  ];
  return (
    <div className="web-share">
      <span className="web-share-lbl">Paylaş</span>
      {items.map(({ Ikon, t }) => (
        <button key={t} className="web-share-btn" title={t}><Ikon size={16} weight="fill" /></button>
      ))}
    </div>
  );
}

export function Article() {
  const { slug = '' } = useParams();
  const nav = useNavigate();
  const bodyRef = useRef<HTMLElement>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [all, setAll] = useState<BlogPostRef[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBlogPost(slug).then(setPost).catch(() => setPost(null));
  }, [slug]);
  useEffect(() => {
    fetchBlogPosts().then(setAll).catch(() => setAll([]));
  }, []);

  const { onceki, sonraki, ilgili } = useMemo(() => {
    const idx = all.findIndex((y) => y.slug === slug);
    const related = all.filter((y) => y.slug !== slug && y.categorySlug === post?.categorySlug).slice(0, 2);
    const filled = related.length < 2
      ? [...related, ...all.filter((y) => y.slug !== slug && !related.includes(y))].slice(0, 2)
      : related;
    return { onceki: all[idx - 1], sonraki: all[idx + 1], ilgili: filled };
  }, [all, slug, post]);

  if (!post) return <main className="web-container web-layout"><div className="web-layout-main" /></main>;

  const renk = catColor(post.categorySlug);
  const harita = DEMO_MAPS[post.slug];
  const paragraphs = post.body.split('\n\n');
  const tags = [post.categoryName, 'Tarih', 'BTTakvim'];

  return (
    <main className="web-container web-layout">
      <article className="web-layout-main" ref={bodyRef}>
        <ReadingProgress targetRef={bodyRef} />
        <div className="web-readcol">
          <nav className="web-crumbs">
            <button onClick={() => nav('/')}>Keşfet</button>
            <CaretRight size={12} color="var(--text-faint)" />
            <span>{post.categoryName}</span>
          </nav>
          <span className="web-label" style={{ fontSize: 12, color: renk }}>{post.categoryName}</span>
          <h1 className="web-article-title">{post.title}</h1>
          <p className="web-article-dek">{post.summary}</p>
          <div className="web-article-byline">
            <div className="web-avatar"><Feather size={18} weight="fill" color="var(--paper-1)" /></div>
            <div>
              <div className="web-author">BTTakvim Kültür Servisi</div>
              <div className="web-meta sm">
                <span>{formatLongDate(post.publishedAtUtc.slice(0, 10))}</span>
                <span className="web-dot">·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Clock size={12} color="var(--text-faint)" />{post.readingMinutes} dk okuma</span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}><ShareRow /></div>
          </div>
        </div>

        <div className="web-article-hero"><Kapak post={post} h={420} iconSize={120} /></div>

        <div className="web-readcol web-body">
          {paragraphs.map((p, i) => <p key={i} className={i === 0 ? 'web-lead' : ''}>{p}</p>)}
          {harita ? <div className="web-map-wrap"><InteractiveMap harita={harita} /></div> : null}

          <div className="web-tags">
            {tags.map((t) => <span key={t} className="web-tag">#{t}</span>)}
          </div>
          <div className="web-author-box">
            <div className="web-avatar lg"><Feather size={24} weight="fill" color="var(--paper-1)" /></div>
            <div>
              <div className="web-author">BTTakvim Kültür Servisi</div>
              <p>Yaprak takviminin ardındaki tarih, gelenek ve kültür hikâyelerini derleyen yazı kurulu.</p>
            </div>
          </div>
        </div>

        <div className="web-prevnext web-readcol">
          {onceki ? <Link className="web-pn" to={`/yazi/${onceki.slug}`}><span>Önceki</span><b>{onceki.title}</b></Link> : <span />}
          {sonraki ? <Link className="web-pn right" to={`/yazi/${sonraki.slug}`}><span>Sonraki</span><b>{sonraki.title}</b></Link> : <span />}
        </div>

        <div className="web-related">
          <div className="web-related-head"><span className="web-label" style={{ fontSize: 12, color: 'var(--accent)' }}>İlgili Yazılar</span></div>
          <div className="web-grid">
            {ilgili.map((y) => (
              <button key={y.slug} className="web-card" onClick={() => nav(`/yazi/${y.slug}`)}>
                <div className="web-card-media"><Kapak post={y} h={168} iconSize={46} /></div>
                <div className="web-card-body">
                  <span className="web-label" style={{ fontSize: 10, color: catColor(y.categorySlug) }}>{y.categoryName}</span>
                  <h3 className="web-card-title">{y.title}</h3>
                  <p className="web-card-dek">{y.summary}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </article>
      <div className="web-layout-aside"><LeafAside /></div>
    </main>
  );
}
