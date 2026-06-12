import {
  CloudSun, Compass, MapPin, Moon, MoonStars,
  Mosque, Sun, SunHorizon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Rosette } from '../components/leaf-bits';
import { fetchLeaf, fetchPrayerTimes } from '../lib/api';
import { formatLongDate, todayIso } from '../lib/dates';
import { useStore } from '../lib/store-context';
import type { Leaf, PrayerTimes } from '../lib/types';

const VAKIT: { key: keyof PrayerTimes['times']; ad: string; Ikon: PhosphorIcon }[] = [
  { key: 'imsak', ad: 'İmsak', Ikon: MoonStars },
  { key: 'gunes', ad: 'Güneş', Ikon: SunHorizon },
  { key: 'ogle', ad: 'Öğle', Ikon: Sun },
  { key: 'ikindi', ad: 'İkindi', Ikon: CloudSun },
  { key: 'aksam', ad: 'Akşam', Ikon: SunHorizon },
  { key: 'yatsi', ad: 'Yatsı', Ikon: Moon },
];

function nextVakit(p: PrayerTimes): keyof PrayerTimes['times'] | null {
  if (p.date !== todayIso()) return null;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const v of VAKIT) {
    const [h, m] = p.times[v.key].split(':').map(Number);
    if (h * 60 + m > mins) return v.key;
  }
  return 'imsak';
}

function remaining(time: string) {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  let diff = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
  if (diff < 0) diff += 1440;
  const sh = Math.floor(diff / 60), sm = diff % 60;
  return sh > 0 ? `${sh} saat ${sm} dakika kaldı` : `${sm} dakika kaldı`;
}

export function Vakitler() {
  const { cities, citySlug, setCity, cityName } = useStore();
  const [prayer, setPrayer] = useState<PrayerTimes | null>(null);
  const [leaf, setLeaf] = useState<Leaf | null>(null);
  const [table, setTable] = useState<PrayerTimes[]>([]);
  const iso = todayIso();

  useEffect(() => { fetchLeaf(iso).then(setLeaf).catch(() => setLeaf(null)); }, [iso]);
  useEffect(() => { fetchPrayerTimes(iso, citySlug).then(setPrayer).catch(() => setPrayer(null)); }, [iso, citySlug]);
  useEffect(() => {
    if (!cities.length) return;
    Promise.all(cities.map((c) => fetchPrayerTimes(iso, c.slug).catch(() => null)))
      .then((r) => setTable(r.filter(Boolean) as PrayerTimes[]));
  }, [cities, iso]);

  const siradaki = prayer ? nextVakit(prayer) : null;
  const siradakiTanim = VAKIT.find((v) => v.key === siradaki);

  return (
    <main className="web-container web-solo">
      <div className="web-vakit-head">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><Rosette size={30} /></div>
        <span className="web-label" style={{ fontSize: 12, color: 'var(--prayer)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Mosque size={14} weight="fill" color="var(--prayer)" /> Diyanet · Yaprak Takvimi
        </span>
        <h1 className="web-masthead-title" style={{ fontSize: 48 }}>Namaz Vakitleri</h1>
        <p className="web-masthead-sub">
          {formatLongDate(iso)}{leaf ? ` · ${leaf.hijri.text}` : ''}
        </p>
      </div>

      <div className="web-citypick">
        {cities.map((c) => (
          <button key={c.slug} className={'web-citychip' + (c.slug === citySlug ? ' on' : '')} onClick={() => setCity(c.slug)}>
            <MapPin size={13} weight={c.slug === citySlug ? 'fill' : 'regular'} color={c.slug === citySlug ? 'var(--text-on-dark)' : 'var(--text-muted)'} />
            {c.name}
          </button>
        ))}
      </div>

      {prayer ? (
        <>
          {siradakiTanim ? (
            <div className="web-vakit-next">
              <div>
                <span className="web-label" style={{ fontSize: 11, color: 'var(--green-wash)' }}>Sıradaki Vakit · {cityName}</span>
                <div className="web-vakit-next-row">
                  <siradakiTanim.Ikon size={40} weight="fill" color="var(--gold-2)" />
                  <div>
                    <div className="web-vakit-next-ad">{siradakiTanim.ad}</div>
                    <div className="web-vakit-next-kal">{remaining(prayer.times[siradakiTanim.key])}</div>
                  </div>
                </div>
              </div>
              <div className="web-vakit-next-saat">{prayer.times[siradakiTanim.key]}</div>
            </div>
          ) : null}

          <div className="web-vakit-grid">
            {VAKIT.map((t) => {
              const on = t.key === siradaki;
              return (
                <div key={t.key} className={'web-vakit-card' + (on ? ' on' : '')}>
                  <t.Ikon size={22} weight={on ? 'fill' : 'regular'} color="var(--prayer)" />
                  <span className="web-vakit-card-ad">{t.ad}</span>
                  <span className="web-vakit-card-saat">{prayer.times[t.key]}</span>
                </div>
              );
            })}
          </div>

          <div className="web-vakit-info">
            <div><Compass size={16} weight="fill" color="var(--green-0)" /> Kıble Saati <b>{prayer.qiblaTime}</b></div>
            <div><Moon size={16} weight="fill" color="var(--ink-2)" /> Gece <b>{prayer.nightLength}</b></div>
            <div><Sun size={16} weight="fill" color="var(--gold-0)" /> Gündüz <b>{prayer.dayLength}</b></div>
          </div>
        </>
      ) : null}

      <div className="web-vakit-table-wrap">
        <div className="web-vakit-table-h"><span className="web-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tüm Şehirler</span></div>
        <table className="web-vakit-table">
          <thead>
            <tr><th>Şehir</th>{VAKIT.map((t) => <th key={t.key}>{t.ad}</th>)}</tr>
          </thead>
          <tbody>
            {table.map((row) => (
              <tr key={row.citySlug} className={row.citySlug === citySlug ? 'on' : ''} onClick={() => setCity(row.citySlug)}>
                <td className="city">{row.cityName}</td>
                {VAKIT.map((t) => <td key={t.key}>{row.times[t.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {prayer?.source.startsWith('mock') ? (
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-faint)', marginTop: 16 }}>
          Vakitler şu an yerel astronomik hesapla üretiliyor (Aladhan servisine ulaşılamadı); bağlantı sağlanınca güncel değerler gösterilir.
        </p>
      ) : null}
    </main>
  );
}
