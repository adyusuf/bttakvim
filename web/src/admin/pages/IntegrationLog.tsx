import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { adminApi } from '../api';

interface Entry {
  timestampUtc: string;
  service: string;
  request: string;
  outcome: 'success' | 'cache' | 'fallback' | 'error';
  source: string;
  cacheHit: boolean;
  durationMs: number;
  statusCode: number | null;
  responseSummary: string | null;
  error: string | null;
}

interface Summary {
  total: number;
  success: number;
  cache: number;
  fallback: number;
  error: number;
  lastErrorUtc: string | null;
}

interface LogResponse { summary: Summary; entries: Entry[]; }

const SERVICE_LABEL: Record<string, string> = {
  'aladhan-timings': 'Namaz Vakitleri',
  'aladhan-gtoh': 'Hicrî (gToH)',
};

const OUTCOME_LABEL: Record<Entry['outcome'], string> = {
  success: 'Başarılı',
  cache: 'Önbellek',
  fallback: 'Yerele Düştü',
  error: 'Hata',
};

function outcomePill(outcome: Entry['outcome']): string {
  if (outcome === 'success') return 'adm-pill ok';
  if (outcome === 'cache') return 'adm-pill off';
  return 'adm-pill warn';
}

export function IntegrationLog() {
  const [data, setData] = useState<LogResponse | null>(null);
  const [auto, setAuto] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => {
    adminApi.get<LogResponse>('/api/admin/integration-log').then(setData).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!auto) return;
    timer.current = setInterval(load, 10000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [auto, load]);

  const s = data?.summary;
  const entries = data?.entries ?? [];

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">Entegrasyon İzleme</div>
          <div className="adm-sub">Dış API'lere giden istekler ve gelen yanıtlar (gelen/giden)</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label className="adm-hint" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            Otomatik (10sn)
          </label>
          <button className="adm-btn ghost sm" onClick={load}>
            <ArrowsClockwise size={14} style={{ verticalAlign: -2 }} /> Yenile
          </button>
        </div>
      </div>

      <p className="adm-hint" style={{ marginTop: 0 }}>
        Son ~200 çağrı; bellek içi tutulur, sunucu yeniden başlayınca sıfırlanır.
      </p>

      {s ? (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div className="adm-stat"><div className="adm-stat-n">{s.total}</div><div className="adm-stat-l">Toplam</div></div>
          <div className="adm-stat"><div className="adm-stat-n" style={{ color: 'var(--green-0)' }}>{s.success}</div><div className="adm-stat-l">Başarılı</div></div>
          <div className="adm-stat"><div className="adm-stat-n">{s.cache}</div><div className="adm-stat-l">Önbellek</div></div>
          <div className="adm-stat"><div className="adm-stat-n" style={{ color: 'var(--red-1)' }}>{s.fallback + s.error}</div><div className="adm-stat-l">Yerele Düşen / Hata</div></div>
          <div className="adm-stat"><div className="adm-stat-n" style={{ fontSize: 14 }}>{s.lastErrorUtc ? new Date(s.lastErrorUtc).toLocaleString('tr-TR') : '—'}</div><div className="adm-stat-l">Son Hata</div></div>
        </div>
      ) : null}

      <table className="adm-table">
        <thead>
          <tr>
            <th>Zaman</th><th>Servis</th><th>İstek</th><th>Durum</th>
            <th>Kaynak</th><th>Cache</th><th>Süre (ms)</th><th>HTTP</th><th>Yanıt / Hata</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={`${e.timestampUtc}-${i}`}>
              <td>{new Date(e.timestampUtc).toLocaleString('tr-TR')}</td>
              <td className="adm-strong">{SERVICE_LABEL[e.service] ?? e.service}</td>
              <td><code>{e.request}</code></td>
              <td><span className={outcomePill(e.outcome)}>{OUTCOME_LABEL[e.outcome] ?? e.outcome}</span></td>
              <td>{e.source}</td>
              <td>{e.cacheHit ? '✓' : '—'}</td>
              <td>{e.durationMs}</td>
              <td>{e.statusCode ?? '—'}</td>
              <td>{e.error ? <span style={{ color: 'var(--red-1)' }}>{e.error}</span> : (e.responseSummary ?? '—')}</td>
            </tr>
          ))}
          {entries.length === 0 ? <tr><td colSpan={9}><div className="adm-empty">Henüz dış API çağrısı kaydedilmedi.</div></td></tr> : null}
        </tbody>
      </table>
    </>
  );
}
