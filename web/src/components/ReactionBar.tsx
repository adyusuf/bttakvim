import { BookmarkSimple, Heart, ShareNetwork, WarningCircle } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { fetchReactionStatus, getDeviceKey, toggleReaction } from '../lib/api';
import type { ReactionStatus, TargetType } from '../lib/types';

export function ReactionBar({ targetType, targetId, shareTitle }: {
  targetType: TargetType; targetId: number; shareTitle: string;
}) {
  const [s, setS] = useState<ReactionStatus | null>(null);
  const dev = getDeviceKey();

  useEffect(() => {
    if (targetId > 0) fetchReactionStatus(targetType, targetId, dev).then(setS).catch(() => {});
  }, [targetType, targetId, dev]);

  const toggle = async (kind: 'Like' | 'Save' | 'Report') => {
    if (targetId <= 0) return;
    if (kind === 'Report' && !confirm('Bu içeriği uygunsuz olarak bildirmek istiyor musunuz?')) return;
    await toggleReaction(targetType, targetId, kind, dev);
    setS(await fetchReactionStatus(targetType, targetId, dev));
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: shareTitle, url }); } catch { /* iptal */ }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Bağlantı kopyalandı.');
    }
  };

  return (
    <div className="bt-react">
      <button className={'bt-react-btn like' + (s?.myLike ? ' on' : '')} onClick={() => toggle('Like')}>
        <Heart size={16} weight={s?.myLike ? 'fill' : 'regular'} /> Beğen{s ? ` · ${s.likes}` : ''}
      </button>
      <button className={'bt-react-btn save' + (s?.mySave ? ' on' : '')} onClick={() => toggle('Save')}>
        <BookmarkSimple size={16} weight={s?.mySave ? 'fill' : 'regular'} /> {s?.mySave ? 'Kaydedildi' : 'Kaydet'}
      </button>
      <button className="bt-react-btn" onClick={share}>
        <ShareNetwork size={16} /> Paylaş
      </button>
      <button className="bt-react-btn report" onClick={() => toggle('Report')}>
        <WarningCircle size={16} /> Bildir{s && s.reports > 0 ? ` · ${s.reports}` : ''}
      </button>
    </div>
  );
}
