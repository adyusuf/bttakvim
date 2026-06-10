import { CalendarDots, MagnifyingGlass } from '@phosphor-icons/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatLongDate, todayIso } from '../lib/dates';

const NAV = [
  { slug: 'tarihi-olaylar', name: 'Tarihî Olaylar' },
  { slug: 'sehirler', name: 'Şehirler' },
  { slug: 'onemli-sahsiyetler', name: 'Şahsiyetler' },
];

export function Header({ onSearch }: { onSearch: () => void }) {
  const loc = useLocation();
  const nav = useNavigate();
  const params = new URLSearchParams(loc.search);
  const activeCat = loc.pathname === '/' ? params.get('kategori') : null;

  return (
    <header className="web-header">
      <div className="web-container web-header-in">
        <Link className="web-logo" to="/">
          <span className="web-logo-mark">BT</span>
          <span className="web-logo-wm">BTTakvim</span>
        </Link>
        <nav className="web-nav">
          <Link className={'web-nav-link' + (loc.pathname === '/' && !activeCat ? ' on' : '')} to="/">Keşfet</Link>
          {NAV.map((k) => (
            <button
              key={k.slug}
              className={'web-nav-link' + (activeCat === k.slug ? ' on' : '')}
              onClick={() => nav(`/?kategori=${k.slug}`)}>
              {k.name}
            </button>
          ))}
          <Link className={'web-nav-link' + (loc.pathname === '/vakitler' ? ' on' : '')} to="/vakitler">Namaz Vakitleri</Link>
        </nav>
        <div className="web-header-tools">
          <button className="web-icon-btn" title="Ara" onClick={onSearch}><MagnifyingGlass size={18} /></button>
          <div className="web-today">
            <CalendarDots size={15} weight="fill" color="var(--accent)" />
            <span>{formatLongDate(todayIso())}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
