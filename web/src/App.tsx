import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SearchOverlay } from './components/SearchOverlay';
import { Tweaks } from './components/Tweaks';
import { Article } from './pages/Article';
import { BlogList } from './pages/BlogList';
import { Vakitler } from './pages/Vakitler';

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <>
      <Header onSearch={() => setSearchOpen(true)} />
      <Routes>
        <Route path="/" element={<BlogList />} />
        <Route path="/yazi/:slug" element={<Article />} />
        <Route path="/vakitler" element={<Vakitler />} />
        <Route path="*" element={<BlogList />} />
      </Routes>
      <Footer />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Tweaks />
    </>
  );
}
