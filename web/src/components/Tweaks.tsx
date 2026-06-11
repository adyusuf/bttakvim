import { Crown, PaintBrushHousehold } from '@phosphor-icons/react';
import { useState } from 'react';
import { useStore } from '../lib/store-context';

const PALETTES = [
  { id: 'osmanli', name: 'Osmanlı Çini', sw: ['#A3271D', '#1E3F8F', '#A97E22', '#1F6F54'] },
  { id: 'hunkar', name: 'Hünkâr Sarayı', sw: ['#8E1F2B', '#1C5A43', '#A07623', '#173A4A'] },
  { id: 'klasik', name: 'Klasik Maarif', sw: ['#9E1B1E', '#A2762B', '#1C4A66', '#2E5C44'] },
  { id: 'gul', name: 'Gül Bahçesi', sw: ['#9B2D45', '#B08A3C', '#5B3A6E', '#4F6B4A'] },
  { id: 'ege', name: 'Ege Sahili', sw: ['#0E7C86', '#C58133', '#143A5E', '#4A6B3F'] },
  { id: 'zeytin', name: 'Zeytin & Bakır', sw: ['#B0532A', '#9C7A2E', '#2A5550', '#3E5A2E'] },
  { id: 'lacivert', name: 'Lacivert Mührü', sw: ['#2A3D7A', '#A07C2E', '#334155', '#2E5C54'] },
  { id: 'antrasit', name: 'Antrasit', sw: ['#C0392B', '#8C7A4A', '#2C3E50', '#3E6B50'] },
];

export function Tweaks() {
  const { prefs, setPrefs } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="web-tweak-btn" title="Tasarım" onClick={() => setOpen((o) => !o)}>
        <PaintBrushHousehold size={22} weight="fill" />
      </button>
      {open ? (
        <div className="web-tweak-panel">
          <div className="web-tweak-h">Renk Paleti</div>
          <div className="web-tweak-palettes">
            {PALETTES.map((p) => (
              <button key={p.id} className={'web-tweak-pal' + (p.id === prefs.paletteId ? ' on' : '')} onClick={() => setPrefs({ paletteId: p.id })}>
                <span className="web-tweak-sw">{p.sw.map((s) => <span key={s} style={{ background: s }} />)}</span>
                <b>{p.name}</b>
              </button>
            ))}
          </div>
          <label className="web-tweak-row">
            <span><Crown size={15} weight="fill" color="var(--gold-0)" style={{ verticalAlign: -3, marginRight: 6 }} />Kubbeli üst</span>
            <input type="checkbox" checked={prefs.dome} onChange={(e) => setPrefs({ dome: e.target.checked })} />
          </label>
          <label className="web-tweak-row">
            <span>Köşe madalyonu</span>
            <input type="checkbox" checked={prefs.medallion} onChange={(e) => setPrefs({ medallion: e.target.checked })} />
          </label>
        </div>
      ) : null}
    </>
  );
}
