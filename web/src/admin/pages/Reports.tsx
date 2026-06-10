import { useEffect, useState } from 'react';
import { adminApi } from '../api';

interface Report { targetType: string; targetId: number; count: number; last: string; }

const TYPE_LABEL: Record<string, string> = {
  Leaf: 'Yaprak', BlogPost: 'Blog Yazısı', ForumTopic: 'Forum Konusu', Comment: 'Yorum', ContentItem: 'İçerik Öğesi',
};

export function Reports() {
  const [list, setList] = useState<Report[]>([]);
  useEffect(() => { adminApi.get<Report[]>('/api/admin/reports').then(setList).catch(() => {}); }, []);

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">Moderasyon</div>
          <div className="adm-sub">Kullanıcıların bildirdiği (report) içerikler</div>
        </div>
      </div>
      <table className="adm-table">
        <thead><tr><th>Tür</th><th>Hedef</th><th>Bildirim</th><th>Son</th></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={`${r.targetType}-${r.targetId}`}>
              <td className="adm-strong">{TYPE_LABEL[r.targetType] ?? r.targetType}</td>
              <td>#{r.targetId}</td>
              <td><span className="adm-pill warn">{r.count} bildirim</span></td>
              <td>{new Date(r.last).toLocaleString('tr-TR')}</td>
            </tr>
          ))}
          {list.length === 0 ? <tr><td colSpan={4}><div className="adm-empty">Bekleyen bildirim yok.</div></td></tr> : null}
        </tbody>
      </table>
    </>
  );
}
