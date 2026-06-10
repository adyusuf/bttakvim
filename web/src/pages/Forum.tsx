import { CaretLeft, ChatCircle, Heart, Plus } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Comments } from '../components/Comments';
import { ReactionBar } from '../components/ReactionBar';
import { Rosette } from '../components/leaf-bits';
import {
  createForumTopic, fetchForumTopic, fetchForumTopics, getAuthorName, getDeviceKey, setAuthorName,
} from '../lib/api';
import type { ForumTopic, ForumTopicRef } from '../lib/types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'bugün';
  if (hrs < 24) return `${hrs} saat önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function NewTopicForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState(getAuthorName());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await createForumTopic({ title: title.trim(), body: body.trim(), authorName: author.trim() || 'Misafir', deviceKey: getDeviceKey() });
      setAuthorName(author);
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Konu açılamadı');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bt-comment-form" style={{ marginBottom: 24 }}>
      {err ? <div style={{ color: 'var(--red-2)', fontSize: 13 }}>{err}</div> : null}
      <input placeholder="Konu başlığı" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder="Açıklama (isteğe bağlı)" value={body} onChange={(e) => setBody(e.target.value)} />
      <input className="name" placeholder="Adınız (isteğe bağlı)" value={author} onChange={(e) => setAuthor(e.target.value)} />
      <div className="actions">
        <button className="bt-react-btn" onClick={onCancel}>Vazgeç</button>
        <button className="bt-comment-submit" disabled={busy || !title.trim()} onClick={submit}>
          {busy ? 'Açılıyor…' : 'Konuyu Aç'}
        </button>
      </div>
    </div>
  );
}

function TopicDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  useEffect(() => { fetchForumTopic(id).then(setTopic).catch(() => setTopic(null)); }, [id]);
  if (!topic) return null;

  return (
    <div className="web-readcol" style={{ maxWidth: 820, margin: '0 auto' }}>
      <button className="bt-comment-tool" style={{ marginBottom: 16 }} onClick={onBack}>
        <CaretLeft size={15} weight="bold" /> Forum
      </button>
      <div className="bt-forum-detail">
        <h1>{topic.title}</h1>
        <div className="bt-forum-meta">
          <span>{topic.authorName}</span><span>·</span><span>{timeAgo(topic.createdAtUtc)}</span>
        </div>
        {topic.body ? <p className="body">{topic.body}</p> : null}
        <div style={{ marginTop: 16 }}>
          <ReactionBar targetType="ForumTopic" targetId={topic.id} shareTitle={topic.title} />
        </div>
      </div>
      <Comments targetType="ForumTopic" targetId={topic.id} />
    </div>
  );
}

export function Forum() {
  const [topics, setTopics] = useState<ForumTopicRef[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);

  const load = () => fetchForumTopics().then(setTopics).catch(() => setTopics([]));
  useEffect(() => { load(); }, []);

  if (openId !== null) {
    return (
      <main className="web-container" style={{ paddingTop: 36, paddingBottom: 64 }}>
        <TopicDetail id={openId} onBack={() => { setOpenId(null); load(); }} />
      </main>
    );
  }

  return (
    <main className="web-container" style={{ paddingTop: 36, paddingBottom: 64, maxWidth: 880 }}>
      <div className="web-masthead">
        <div className="web-eyebrow">
          <Rosette size={26} />
          <span className="web-label" style={{ fontSize: 12, color: 'var(--accent)' }}>Tartışma · Sohbet</span>
        </div>
        <h1 className="web-masthead-title">Forum</h1>
        <p className="web-masthead-sub">Takvim yaprakları ve yazılar üzerine sohbet edin, yeni konular açın.</p>
      </div>

      {composing ? (
        <NewTopicForm onCreated={() => { setComposing(false); load(); }} onCancel={() => setComposing(false)} />
      ) : (
        <button className="adm-btn" style={{ marginBottom: 22 }} onClick={() => setComposing(true)}>
          <Plus size={16} /> Yeni Konu Aç
        </button>
      )}

      <div className="bt-forum-list">
        {topics.map((t) => (
          <button key={t.id} className="bt-forum-card" onClick={() => setOpenId(t.id)}>
            <h3 className="bt-forum-title">{t.title}</h3>
            {t.body ? <p className="bt-forum-excerpt">{t.body.slice(0, 160)}{t.body.length > 160 ? '…' : ''}</p> : null}
            <div className="bt-forum-meta">
              <span>{t.authorName}</span>
              <span>·</span>
              <span>{timeAgo(t.createdAtUtc)}</span>
              <span><ChatCircle size={14} /> {t.commentCount}</span>
              <span><Heart size={14} /> {t.likeCount}</span>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
