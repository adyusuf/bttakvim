import { useEffect, useState } from 'react';
import { Minus, Plus } from '@phosphor-icons/react';
import { adminApi } from '../api';

type SettingsMap = Record<string, string>;

const METHODS = [
  { value: '13', label: 'Diyanet İşleri Başkanlığı (Türkiye)' },
  { value: '3', label: 'Muslim World League (MWL)' },
  { value: '2', label: 'ISNA (Kuzey Amerika)' },
  { value: '4', label: "Ümmü'l-Kura (Mekke)" },
  { value: '5', label: 'Mısır Genel Müftülüğü' },
  { value: '1', label: 'Karaçi (Pakistan)' },
];

const TUNE_LABELS = ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function parseTune(value: string | undefined): number[] {
  const parts = (value ?? '').split(',').map((p) => Number.parseInt(p.trim(), 10));
  return Array.from({ length: 6 }, (_, i) => (Number.isFinite(parts[i]) ? parts[i] : 0));
}

export function Integrations() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [saved, setSaved] = useState<string | null>(null);

  const load = () => adminApi.get<SettingsMap>('/api/admin/settings').then(setSettings).catch(() => {});
  useEffect(() => { load(); }, []);

  const update = async (key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
    await adminApi.put('/api/admin/settings', { key, value });
    setSaved(key);
    setTimeout(() => setSaved((k) => (k === key ? null : k)), 1500);
  };

  const hijriOffset = clamp(Number.parseInt(settings.hijri_day_offset ?? '0', 10) || 0, -2, 2);
  const method = settings.prayer_default_method ?? '13';
  const school = settings.prayer_default_school ?? '0';
  const tune = parseTune(settings.prayer_default_tune);

  const setTuneAt = (i: number, delta: number) => {
    const next = tune.slice();
    next[i] = clamp(next[i] + delta, -60, 60);
    void update('prayer_default_tune', next.join(','));
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">Entegrasyon Ayarları</div>
          <div className="adm-sub">Hicrî hizalama ve namaz vakti varsayılanları</div>
        </div>
      </div>

      <p className="adm-hint" style={{ marginBottom: 8 }}>
        Bu değerler sunucu geneli <b>varsayılanlardır</b>. Son kullanıcılar Vakitler sayfasında kendi
        tercihleriyle bu varsayılanları geçersiz kılabilir.
      </p>

      {/* ---- Hicrî gün ofseti ---- */}
      <div className="adm-section-rule"><span>Hicrî Gün Ofseti</span><i /></div>
      <p className="adm-hint" style={{ marginTop: 0 }}>
        UmAlQura hesabını Diyanet ilanına ±gün hizalar. Varsayılan 0.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          className="adm-btn ghost sm"
          disabled={hijriOffset <= -2}
          onClick={() => update('hijri_day_offset', String(clamp(hijriOffset - 1, -2, 2)))}
          aria-label="Azalt"><Minus size={14} /></button>
        <div className="adm-stat-n" style={{ fontSize: 22, minWidth: 48, textAlign: 'center' }}>
          {hijriOffset > 0 ? `+${hijriOffset}` : hijriOffset} gün
        </div>
        <button
          className="adm-btn ghost sm"
          disabled={hijriOffset >= 2}
          onClick={() => update('hijri_day_offset', String(clamp(hijriOffset + 1, -2, 2)))}
          aria-label="Artır"><Plus size={14} /></button>
        {saved === 'hijri_day_offset' ? <span className="adm-hint" style={{ color: 'var(--green-0)' }}>kaydedildi ✓</span> : null}
      </div>

      {/* ---- Varsayılan namaz yöntemi ---- */}
      <div className="adm-section-rule"><span>Varsayılan Namaz Yöntemi</span><i /></div>
      <div className="adm-field" style={{ maxWidth: 380 }}>
        <select value={method} onChange={(e) => update('prayer_default_method', e.target.value)}>
          {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      {saved === 'prayer_default_method' ? <p className="adm-hint" style={{ color: 'var(--green-0)' }}>kaydedildi ✓</p> : null}

      {/* ---- Varsayılan Asr mezhebi ---- */}
      <div className="adm-section-rule"><span>Varsayılan Asr (İkindi) Mezhebi</span><i /></div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[{ v: '0', l: 'Şâfiî / Standart' }, { v: '1', l: 'Hanefî' }].map((o) => {
          const on = school === o.v;
          return (
            <button
              key={o.v}
              onClick={() => update('prayer_default_school', o.v)}
              className="adm-stat"
              style={{ textAlign: 'left', cursor: 'pointer', flex: '1 1 200px', borderColor: on ? 'var(--accent)' : 'var(--rule)', borderWidth: on ? 2 : 1, background: on ? 'var(--accent-soft)' : 'var(--surface-card)' }}>
              <div className="adm-stat-n" style={{ fontSize: 17, color: on ? 'var(--accent)' : 'var(--ink-0)' }}>{o.l}{on ? ' ✓' : ''}</div>
            </button>
          );
        })}
      </div>
      {saved === 'prayer_default_school' ? <p className="adm-hint" style={{ color: 'var(--green-0)' }}>kaydedildi ✓</p> : null}

      {/* ---- Varsayılan temkin (tune) ---- */}
      <div className="adm-section-rule"><span>Varsayılan Temkin (Dakika)</span><i /></div>
      <p className="adm-hint" style={{ marginTop: 0 }}>
        Her vakte uygulanan dakika ofseti (−60…+60).
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {TUNE_LABELS.map((label, i) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div className="adm-stat-l" style={{ marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="adm-btn ghost sm" disabled={tune[i] <= -60} onClick={() => setTuneAt(i, -1)} aria-label={`${label} azalt`}><Minus size={12} /></button>
              <div className="adm-stat-n" style={{ fontSize: 16, minWidth: 34, textAlign: 'center' }}>{tune[i] > 0 ? `+${tune[i]}` : tune[i]}</div>
              <button className="adm-btn ghost sm" disabled={tune[i] >= 60} onClick={() => setTuneAt(i, 1)} aria-label={`${label} artır`}><Plus size={12} /></button>
            </div>
          </div>
        ))}
      </div>
      {saved === 'prayer_default_tune' ? <p className="adm-hint" style={{ marginTop: 12, color: 'var(--green-0)' }}>kaydedildi ✓</p> : null}
    </>
  );
}
