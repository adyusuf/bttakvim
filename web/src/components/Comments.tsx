import { ChatCircle, Heart } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchComments, getAuthorName, getDeviceKey, postComment, setAuthorName, toggleReaction,
} from '../lib/api';
import type { Comment, TargetType } from '../lib/types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} saat önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

function CommentForm({ onSubmit, compact, autoFocus }: {
  onSubmit: (author: string, body: string) => Promise<void>; compact?: boolean; autoFocus?: boolean;
}) {
  const [author, setAuthor] = useState(getAuthorName());
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await onSubmit(author.trim() || 'Misafir', body.trim());
      setBody('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bt-comment-form">
      <div className="row">
        <input className="name" placeholder="Adınız (isteğe bağlı)" value={author}
          onChange={(e) => { setAuthor(e.target.value); setAuthorName(e.target.value); }} />
      </div>
      <textarea placeholder={compact ? 'Yanıtınız…' : 'Yorumunuzu yazın…'} value={body}
        autoFocus={autoFocus} onChange={(e) => setBody(e.target.value)} />
      <div className="actions">
        <button className="bt-comment-submit" disabled={busy || !body.trim()} onClick={submit}>
          {busy ? 'Gönderiliyor…' : compact ? 'Yanıtla' : 'Yorum Yap'}
        </button>
      </div>
    </div>
  );
}

function CommentNode({ comment, targetType, targetId, onPosted }: {
  comment: Comment; targetType: TargetType; targetId: number; onPosted: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [likes, setLikes] = useState(comment.likes);
  const [liked, setLiked] = useState(false);
  const dev = getDeviceKey();

  const like = async () => {
    const r = await toggleReaction('Comment', comment.id, 'Like', dev);
    setLikes(r.count);
    setLiked(r.active);
  };

  const reply = async (author: string, body: string) => {
    await postComment({ targetType, targetId, parentId: comment.id, authorName: author, deviceKey: dev, body });
    setReplying(false);
    onPosted();
  };

  return (
    <div className="bt-comment">
      <div className="bt-comment-meta">
        <span className="bt-comment-author">{comment.authorName}</span>
        <span className="bt-comment-date">{timeAgo(comment.createdAtUtc)}</span>
      </div>
      <p className="bt-comment-body">{comment.body}</p>
      <div className="bt-comment-tools">
        <button className={'bt-comment-tool' + (liked ? ' on' : '')} onClick={like}>
          <Heart size={14} weight={liked ? 'fill' : 'regular'} /> {likes > 0 ? likes : 'Beğen'}
        </button>
        <button className="bt-comment-tool" onClick={() => setReplying((r) => !r)}>
          <ChatCircle size={14} /> Yanıtla
        </button>
      </div>
      {replying ? <div className="bt-comment-reply"><CommentForm compact autoFocus onSubmit={reply} /></div> : null}
      {comment.replies.length > 0 ? (
        <div className="bt-comment-children">
          {comment.replies.map((c) => (
            <CommentNode key={c.id} comment={c} targetType={targetType} targetId={targetId} onPosted={onPosted} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Comments({ targetType, targetId }: { targetType: TargetType; targetId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const dev = getDeviceKey();

  const load = useCallback(() => {
    if (targetId > 0) fetchComments(targetType, targetId).then(setComments).catch(() => {});
  }, [targetType, targetId]);
  useEffect(() => { load(); }, [load]);

  const count = (cs: Comment[]): number => cs.reduce((n, c) => n + 1 + count(c.replies), 0);

  const add = async (author: string, body: string) => {
    await postComment({ targetType, targetId, authorName: author, deviceKey: dev, body });
    load();
  };

  return (
    <div className="bt-comments">
      <h2 className="bt-comments-h">Yorumlar{comments.length ? ` · ${count(comments)}` : ''}</h2>
      <CommentForm onSubmit={add} />
      {comments.length === 0 ? (
        <div className="bt-comment-empty">İlk yorumu siz yapın.</div>
      ) : (
        comments.map((c) => (
          <CommentNode key={c.id} comment={c} targetType={targetType} targetId={targetId} onPosted={load} />
        ))
      )}
    </div>
  );
}
