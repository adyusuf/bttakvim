import { ArrowClockwise } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { formatLongDate } from '../../lib/dates';

interface LeafRow { id: number; date: string; createdAtUtc: string; }

export function Leaves() {
  const [list, setList] = useState<LeafRow[]>([]);
  const load = () => adminApi.get<LeafRow[]>('/api/admin/leaves').then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  const reset = async (date: string) => {
    if (!confirm(`${formatLongDate(date)} yaprağı sıfırlansın mı? Sonraki ziyarette güncel havuzdan yeniden üretilecek.`)) return;
    await adminApi.del(`/api/admin/leaves/${date}`);
    load();
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">Yapraklar</div>
          <div className="adm-sub">Üretilmiş (ziyaret edilmiş) yapraklar — yalnızca bunlar veritabanında</div>
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, maxWidth: 680 }}>
        Bir yaprak üretildikten sonra değişmez. Sıfırlarsanız silinir; o tarih tekrar görüntülendiğinde
        güncel içerik havuzundan yeniden üretilir.
      </p>

      <table className="adm-table">
        <thead><tr><th>Tarih</th><th>Üretilme</th><th></th></tr></thead>
        <tbody>
          {list.map((l) => (
            <tr key={l.id}>
              <td className="adm-strong">{formatLongDate(l.date)}</td>
              <td>{new Date(l.createdAtUtc).toLocaleString('tr-TR')}</td>
              <td><div className="adm-actions">
                <button className="adm-btn danger sm" onClick={() => reset(l.date)}><ArrowClockwise size={13} /> Sıfırla</button>
              </div></td>
            </tr>
          ))}
          {list.length === 0 ? <tr><td colSpan={3}><div className="adm-empty">Henüz yaprak üretilmemiş.</div></td></tr> : null}
        </tbody>
      </table>
    </>
  );
}
