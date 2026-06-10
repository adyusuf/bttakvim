import { useEffect, useState } from 'react';
import { adminApi } from '../api';

type SettingsMap = Record<string, string>;

const CONTENT_MODES = [
  { value: 'random', label: 'Rastgele', desc: 'Sabitlenmemiş içerikler her yaprakta havuzdan rastgele seçilir.' },
  { value: 'fixed', label: 'Sabit', desc: 'Yalnızca o güne sabitlenmiş içerikler gösterilir.' },
];

export function Settings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [saved, setSaved] = useState<string | null>(null);

  const load = () => adminApi.get<SettingsMap>('/api/admin/settings').then(setSettings).catch(() => {});
  useEffect(() => { load(); }, []);

  const update = async (key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
    await adminApi.put('/api/admin/settings', { key, value });
    setSaved(key);
    setTimeout(() => setSaved(null), 1500);
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">Ayarlar</div>
          <div className="adm-sub">İçerik seçim modu ve sağlayıcılar</div>
        </div>
      </div>

      <div className="adm-section-rule"><span>İçerik Gösterim Modu</span><i /></div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {CONTENT_MODES.map((m) => {
          const on = (settings.content_mode ?? 'random') === m.value;
          return (
            <button
              key={m.value}
              onClick={() => update('content_mode', m.value)}
              className="adm-stat"
              style={{ textAlign: 'left', cursor: 'pointer', flex: '1 1 260px', borderColor: on ? 'var(--accent)' : 'var(--rule)', borderWidth: on ? 2 : 1, background: on ? 'var(--accent-soft)' : 'var(--surface-card)' }}>
              <div className="adm-stat-n" style={{ fontSize: 18, color: on ? 'var(--accent)' : 'var(--ink-0)' }}>{m.label}{on ? ' ✓' : ''}</div>
              <div className="adm-stat-l">{m.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="adm-section-rule"><span>Sağlayıcılar</span><i /></div>
      <table className="adm-table">
        <thead><tr><th>Sağlayıcı</th><th>Değer</th><th>Durum</th></tr></thead>
        <tbody>
          <tr><td className="adm-strong">Ay Evresi</td><td><code>{settings.moon_provider ?? 'mock'}</code></td><td><span className="adm-pill off">Mock</span></td></tr>
          <tr><td className="adm-strong">Namaz Vakitleri</td><td><code>{settings.prayer_provider ?? 'mock-diyanet'}</code></td><td><span className="adm-pill off">Mock · Diyanet bağlanacak</span></td></tr>
        </tbody>
      </table>
      <p className="adm-hint" style={{ marginTop: 12 }}>
        Sağlayıcılar arayüz arkasında soyutlanmıştır; gerçek servisler (Diyanet, bilimsel ay API'si) Faz 5'te bağlanacak.
      </p>
      {saved ? <p className="adm-hint" style={{ marginTop: 10, color: 'var(--green-0)' }}>Kaydedildi ✓</p> : null}
    </>
  );
}
