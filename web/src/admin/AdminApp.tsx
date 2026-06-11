import {
  ChartBar, FileText, Gear, Newspaper, Scroll, SignOut, Stack, Tag, WarningCircle,
} from '@phosphor-icons/react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAdminAuth } from './auth-context';
import { AdminLogin } from './Login';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { ContentItems } from './pages/ContentItems';
import { HistoryEvents } from './pages/HistoryEvents';
import { BlogPosts } from './pages/BlogPosts';
import { Leaves } from './pages/Leaves';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import './admin.css';

const NAV = [
  { to: '/admin', end: true, label: 'Panel', Icon: ChartBar },
  { to: '/admin/kategoriler', label: 'Kategoriler', Icon: Tag },
  { to: '/admin/icerikler', label: 'İçerik Öğeleri', Icon: Stack },
  { to: '/admin/gecmiste-bugun', label: 'Geçmişte Bugün', Icon: Scroll },
  { to: '/admin/blog', label: 'Blog Yazıları', Icon: Newspaper },
  { to: '/admin/yapraklar', label: 'Yapraklar', Icon: FileText },
  { to: '/admin/raporlar', label: 'Moderasyon', Icon: WarningCircle },
  { to: '/admin/ayarlar', label: 'Ayarlar', Icon: Gear },
];

function Shell() {
  const { name, logout } = useAdminAuth();
  const nav = useNavigate();
  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          <div className="adm-brand-mark">BT</div>
          <div>
            <div className="adm-brand-wm">BTTakvim</div>
            <div className="adm-brand-sub">Yönetim</div>
          </div>
        </div>
        <nav className="adm-nav">
          {NAV.map(({ to, end, label, Icon }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => 'adm-nav-link' + (isActive ? ' on' : '')}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="adm-side-foot">
          <b>{name}</b>
          <button onClick={() => { logout(); nav('/admin/giris'); }}><SignOut size={14} style={{ verticalAlign: -2 }} /> Çıkış</button>
        </div>
      </aside>
      <main className="adm-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="kategoriler" element={<Categories />} />
          <Route path="icerikler" element={<ContentItems />} />
          <Route path="gecmiste-bugun" element={<HistoryEvents />} />
          <Route path="blog" element={<BlogPosts />} />
          <Route path="yapraklar" element={<Leaves />} />
          <Route path="raporlar" element={<Reports />} />
          <Route path="ayarlar" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function AdminApp() {
  const { authed } = useAdminAuth();
  return (
    <Routes>
      <Route path="giris" element={authed ? <Navigate to="/admin" replace /> : <AdminLogin />} />
      <Route path="*" element={authed ? <Shell /> : <Navigate to="/admin/giris" replace />} />
    </Routes>
  );
}
