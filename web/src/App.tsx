import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminApp } from './admin/AdminApp';
import { AdminAuthProvider } from './admin/auth';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SearchOverlay } from './components/SearchOverlay';
import { Tweaks } from './components/Tweaks';
import { Article } from './pages/Article';
import { BlogList } from './pages/BlogList';
import { Forum } from './pages/Forum';
import { Vakitler } from './pages/Vakitler';

function Site() {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <>
      <Header onSearch={() => setSearchOpen(true)} />
      <Routes>
        <Route path="/" element={<BlogList />} />
        <Route path="/yazi/:slug" element={<Article />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/vakitler" element={<Vakitler />} />
        <Route path="*" element={<BlogList />} />
      </Routes>
      <Footer />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Tweaks />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminAuthProvider><AdminApp /></AdminAuthProvider>} />
      <Route path="/*" element={<Site />} />
    </Routes>
  );
}
