/** BTTakvim Web — takvim yaprağı (ön + arka yüz). Kaynak: ui_kits/mobil/leaf.jsx. */
import {
  Brain, Compass, CookingPot, FlowerLotus, FlowerTulip, ForkKnife,
  Moon, Mosque, Quotes, Scroll,
} from '@phosphor-icons/react';
import { Arch, DayNightDial, MiniMonth, MoonPhase, Rosette } from './leaf-bits';
import { titleCase, TURKISH_MONTHS } from '../lib/dates';
import type { Leaf, LeafContent, PrayerTimes } from '../lib/types';

const VAKIT = [
  { key: 'imsak', ad: 'İmsak' }, { key: 'gunes', ad: 'Güneş' }, { key: 'ogle', ad: 'Öğle' },
  { key: 'ikindi', ad: 'İkindi' }, { key: 'aksam', ad: 'Akşam' }, { key: 'yatsi', ad: 'Yatsı' },
] as const;

const isWaxing = (k: string) => ['new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous'].includes(k);
function moonSentence(key: string, name: string) {
  const m: Record<string, string> = {
    new_moon: 'Bu gece Yeni Ay', waxing_crescent: 'Hilal büyüyor', first_quarter: 'Bu gece yarım ay büyüyor',
    waxing_gibbous: 'Ay dolunaya yaklaşıyor', full_moon: 'Bu gece Dolunay', waning_gibbous: 'Dolunay küçülüyor',
    last_quarter: 'Ay son dördününde küçülüyor', waning_crescent: 'Hilal inceliyor',
  };
  return m[key] ?? name;
}

function Ornament() {
  return (
    <div className="leaf-ornament" style={{ margin: '12px 0' }}>
      <i className="l" />
      <span style={{ width: 5, height: 5, background: 'var(--gold-0)', transform: 'rotate(45deg)', display: 'inline-block' }} />
      <FlowerLotus size={14} weight="fill" color="var(--gold-0)" />
      <span style={{ width: 5, height: 5, background: 'var(--gold-0)', transform: 'rotate(45deg)', display: 'inline-block' }} />
      <i className="r" />
    </div>
  );
}

export interface LeafLocation {
  cities: { slug: string; name: string }[];
  citySlug: string;
  setCity: (slug: string) => void;
}

export function LeafFront({ leaf, prayer, location }: {
  leaf: Leaf; prayer: PrayerTimes | null; location: LeafLocation;
}) {
  const monthNo = Number(leaf.date.split('-')[1]);
  const vurgu = leaf.specialDay
    ? leaf.specialDay.toLocaleUpperCase('tr')
    : leaf.weekdayName === 'Cuma' ? 'HAYIRLI CUMALAR' : `YILIN ${leaf.dayOfYear}. GÜNÜ`;

  return (
    <div className="leaf-pad">
      <div className="leaf-brand">
        <div className="leaf-brand-l">
          <span className="leaf-brand-mark">BT</span>
          <div style={{ lineHeight: 1 }}>
            <div className="leaf-brand-wm">BTTakvim</div>
            <span className="leaf-label" style={{ fontSize: 8, color: 'var(--text-faint)', display: 'block', marginTop: 2 }}>Günlük Yaprak Takvimi</span>
          </div>
        </div>
        <Rosette size={30} />
        <span className="leaf-year">{leaf.year}</span>
      </div>

      <Ornament />

      <div className="leaf-quote">
        <Quotes size={16} weight="fill" color="var(--ornament)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <span className="leaf-quote-txt">{leaf.quote.text}</span>
          {leaf.quote.author ? <span className="leaf-quote-src"> — {leaf.quote.author}</span> : null}
        </div>
      </div>

      <div className="leaf-hero">
        <div className="leaf-hero-arch"><Arch /></div>
        <div className="leaf-hero-in">
          <Rosette size={18} />
          <div className="leaf-month">{leaf.monthName.toLocaleUpperCase('tr')}</div>
          <div className="leaf-submonth">{monthNo}. Ay · Yılın {leaf.dayOfYear}. Günü</div>
          <div className="leaf-bigday">{leaf.day}</div>
          <div className="leaf-dayname">{leaf.weekdayName.toLocaleUpperCase('tr')}</div>
          <div><span className="leaf-vurgu">{vurgu}</span></div>
        </div>
      </div>

      <Ornament />

      <div className="leaf-grid2">
        <div className="leaf-panel" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <MoonPhase illum={leaf.moon.illumination} waxing={isWaxing(leaf.moon.key)} size={38} />
          <div>
            <span className="leaf-label" style={{ fontSize: 8, color: 'var(--text-faint)' }}>Ayın Durumu</span>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--ink-1)', lineHeight: 1.3, marginTop: 2 }}>
              {moonSentence(leaf.moon.key, leaf.moon.name)}
            </div>
          </div>
        </div>
        <div className="leaf-panel">
          <span className="leaf-label" style={{ fontSize: 8, color: 'var(--text-faint)' }}>Yavrunuza İsim</span>
          <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-serif)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Kız</span><span style={{ fontWeight: 600, color: 'var(--accent)' }}>{leaf.names.girl?.name ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-serif)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Erkek</span><span style={{ fontWeight: 600, color: 'var(--blue-1)' }}>{leaf.names.boy?.name ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="leaf-grid2" style={{ gridTemplateColumns: '1fr 1.05fr', marginTop: 10 }}>
        <div className="leaf-panel">
          <span className="leaf-label" style={{ fontSize: 8, color: 'var(--text-faint)', display: 'block', textAlign: 'center', marginBottom: 6 }}>
            {leaf.monthName.toLocaleUpperCase('tr')} {leaf.year}
          </span>
          <MiniMonth year={leaf.year} month={monthNo} day={leaf.day} />
        </div>
        <div className="leaf-panel" style={{ padding: '4px 10px' }}>
          <Stat l="Hicrî Yıl" v={leaf.hijri.year} />
          <Stat l={leaf.hijri.monthName} v={leaf.hijri.day} />
          <Stat l="Rûmî Yıl" v={leaf.rumi.year} />
          <Stat l={leaf.rumi.monthName} v={leaf.rumi.day} />
          <Stat l={`${leaf.seasonal.label} Günleri`} v={leaf.seasonal.day} />
          {leaf.coldPeriod
            ? <Stat l={leaf.coldPeriod.label} v={leaf.coldPeriod.day} last />
            : <Stat l="Kıble Saati" v={prayer?.qiblaTime ?? '—'} last />}
        </div>
      </div>

      <div className="leaf-panel" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
        <DayNightDial dayFraction={prayer?.dayFraction ?? 0.4} dayText={prayer?.dayLength ?? ''} size={92} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Inline icon={<Moon size={12} weight="fill" color="var(--ink-2)" />} label="Gece" value={prayer?.nightLength ?? '—'} />
          <div style={{ height: 1, background: 'var(--rule)' }} />
          <div>
            <span className="leaf-label" style={{ fontSize: 8, color: 'var(--text-faint)' }}>
              {prayer && prayer.dayLengthDeltaSeconds < 0 ? 'Gecenin Uzaması' : 'Gündüzün Uzaması'}
            </span>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--ink-1)', marginTop: 1 }}>{prayer?.dayLengthDeltaText ?? '—'}</div>
          </div>
          <Inline icon={<Compass size={12} weight="fill" color="var(--green-0)" />} label="Kıble Saati" value={prayer?.qiblaTime ?? '—'} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <Mosque size={12} weight="fill" color="var(--prayer)" />
          <span className="leaf-label" style={{ fontSize: 11, color: 'var(--prayer)' }}>Namaz Vakitleri</span>
        </div>
        <div className="leaf-citychips">
          {location.cities.map((c) => (
            <button key={c.slug} className={'leaf-citychip' + (c.slug === location.citySlug ? ' on' : '')} onClick={() => location.setCity(c.slug)}>{c.name}</button>
          ))}
        </div>
        {prayer ? (
          <div className="leaf-vakit">
            {VAKIT.map((v) => (
              <div key={v.key} className="leaf-vakit-cell">
                <span className="leaf-vakit-ad">{v.ad}</span>
                <span className="leaf-vakit-saat">{prayer.times[v.key]}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 16 }}>
        <span className="leaf-label" style={{ fontSize: 11, color: 'var(--text-faint)', display: 'block', marginBottom: 7 }}>Günün Fotoğrafı</span>
        <div className="leaf-photo">
          <img src={photoFor(leaf.date)} alt="" />
        </div>
      </div>
    </div>
  );
}

function Stat({ l, v, last }: { l: string; v: string | number; last?: boolean }) {
  return (
    <div className="leaf-stat" style={last ? { borderBottom: 'none' } : undefined}>
      <span className="leaf-stat-l">{l}</span><span className="leaf-stat-v">{v}</span>
    </div>
  );
}
function Inline({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{icon} {label}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{value}</span>
    </div>
  );
}

const PHOTOS = ['/photos/foto-ege-koy-w.jpg', '/photos/foto-tas-ev-w.jpg', '/photos/foto-ege-deniz-w.jpg'];
function photoFor(iso: string) {
  const n = iso.split('-').reduce((a, p) => a + Number(p), 0);
  return PHOTOS[n % PHOTOS.length];
}

export function LeafBack({ leaf }: { leaf: Leaf }) {
  const by = (slug: string): LeafContent | undefined => leaf.contents.find((c) => c.categorySlug === slug);
  const sohbet = by('gunun-sohbeti'), felsefe = by('biraz-da-felsefe'), yemek = by('gastronomi'), menu = by('gunun-menusu');
  const consumed = new Set(['gunun-sohbeti', 'biraz-da-felsefe', 'gastronomi', 'gunun-menusu', 'ozel-gunler']);
  const digerleri = leaf.contents.filter((c) => !consumed.has(c.categorySlug));
  const tarih = `${leaf.day} ${titleCase(leaf.monthName)} ${leaf.year}`;

  return (
    <div className="leaf-pad">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="leaf-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Arka Yüz</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--ink-0)' }}>{tarih}</span>
      </div>
      <Ornament />

      {sohbet ? (
        <Section
          etiket={leaf.weekdayName === 'Cuma' ? 'CUMA SOHBETİ' : 'GÜNÜN SOHBETİ'}
          baslik={sohbet.title} body={sohbet.body} dropcap
          icon={<FlowerTulip size={12} weight="fill" color="var(--gold-2)" />} />
      ) : null}

      {leaf.historyEvents.length > 0 ? (
        <div className="leaf-section">
          <SectionHead etiket="GEÇMİŞTE BUGÜN" baslik="Bazı Yaşanmışlar" icon={<Scroll size={12} weight="fill" color="var(--gold-2)" />} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leaf.historyEvents.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--accent)', flexShrink: 0, width: 42 }}>{o.year}</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, lineHeight: 1.5, color: 'var(--ink-1)' }}>{o.text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {felsefe ? (
        <Section etiket="BİRAZ DA FELSEFE" baslik={felsefe.title} body={felsefe.body} icon={<Brain size={12} weight="fill" color="var(--gold-2)" />} />
      ) : null}

      {yemek ? (
        <div className="leaf-section">
          <SectionHead etiket="YEMEK KÜLTÜRÜ" baslik={yemek.title} icon={<ForkKnife size={12} weight="fill" color="var(--gold-2)" />} />
          <p className="leaf-section-body" style={{ marginBottom: 10 }}>{yemek.body}</p>
          {menu ? (
            <div className="leaf-menu">
              <span className="leaf-label" style={{ fontSize: 9, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <CookingPot size={12} weight="fill" color="var(--accent)" /> Günün Menüsü
              </span>
              <div className="leaf-menu-chips">
                {menu.body.split(',').map((m, i) => <span key={i} className="leaf-menu-chip">{m.trim()}</span>)}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {digerleri.map((c) => (
        <Section key={c.itemId} etiket={c.categoryName.toLocaleUpperCase('tr')} baslik={c.title} body={c.body} />
      ))}

      <Ornament />
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>
        {tarih} — {titleCase(leaf.weekdayName)} — {leaf.hijri.day} {leaf.hijri.monthName} {leaf.hijri.year} — {leaf.seasonal.day} {leaf.seasonal.label} Günleri
      </div>
    </div>
  );
}

function SectionHead({ etiket, baslik, icon }: { etiket: string; baslik: string; icon?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div className="leaf-section-head">
        <span className="leaf-section-tab">{icon}{etiket}</span>
        <span className="leaf-section-line" />
      </div>
      <div className="leaf-section-title">{baslik}</div>
    </div>
  );
}

function Section({ etiket, baslik, body, icon, dropcap }: {
  etiket: string; baslik: string; body: string; icon?: React.ReactNode; dropcap?: boolean;
}) {
  return (
    <div className="leaf-section">
      <SectionHead etiket={etiket} baslik={baslik} icon={icon} />
      <p className={'leaf-section-body' + (dropcap ? ' leaf-dropcap' : '')}>{body}</p>
    </div>
  );
}

export { TURKISH_MONTHS };
