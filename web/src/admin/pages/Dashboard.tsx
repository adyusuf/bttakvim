import { useEffect, useState } from 'react';
import { adminApi } from '../api';

interface Summary {
  leaves: number; categories: number; contentItems: number;
  historyEvents: number; blogPosts: number; comments: number; reports: number;
}

const CARDS: { key: keyof Summary; label: string }[] = [
  { key: 'leaves', label: 'Üretilmiş Yaprak' },
  { key: 'categories', label: 'İçerik Kategorisi' },
  { key: 'contentItems', label: 'İçerik Öğesi' },
  { key: 'historyEvents', label: 'Geçmişte Bugün' },
  { key: 'blogPosts', label: 'Blog Yazısı' },
  { key: 'comments', label: 'Yorum' },
  { key: 'reports', label: 'Bildirim' },
];

export function Dashboard() {
  const [s, setS] = useState<Summary | null>(null);
  useEffect(() => { adminApi.get<Summary>('/api/admin/summary').then(setS).catch(() => {}); }, []);
  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">Yönetim Paneli</div>
          <div className="adm-sub">BTTakvim içerik ve takvim yönetimi</div>
        </div>
      </div>
      <div className="adm-cards">
        {CARDS.map((c) => (
          <div key={c.key} className="adm-stat">
            <div className="adm-stat-n">{s ? s[c.key] : '—'}</div>
            <div className="adm-stat-l">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="adm-section-rule"><span>Yaprak Kuralı</span><i /></div>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-1)', maxWidth: 680 }}>
        Bir tarih ilk kez ziyaret edildiğinde yaprağı üretilir ve veritabanına yazılır; bir daha
        değişmez. <b>Yapraklar</b> ekranından bir günü sıfırlarsanız o yaprak silinir ve sonraki
        ziyarette güncel içerik havuzundan yeniden üretilir. İçeriklerin hangi gün gösterileceği
        <b> Ayarlar</b>'dan rastgele ya da sabit moda alınabilir; tek tek öğeler ay-güne sabitlenebilir.
      </p>
    </>
  );
}
