import { PaperPlaneTilt } from '@phosphor-icons/react';

const COLS = [
  { b: 'Takvim', l: ['Bugünün Yaprağı', 'Geçmiş Yapraklar', 'Namaz Vakitleri', 'Dini Günler'] },
  { b: 'Keşfet', l: ['Tarihî Olaylar', 'Şehirler', 'Şahsiyetler', 'İnteraktif Haritalar'] },
  { b: 'Kurumsal', l: ['Hakkımızda', 'İletişim', 'Gizlilik', 'Künye'] },
];

export function Footer() {
  return (
    <footer className="web-footer">
      <div className="web-container web-footer-in">
        <div className="web-footer-brand">
          <div className="web-logo">
            <span className="web-logo-mark">BT</span>
            <span className="web-logo-wm" style={{ color: 'var(--text-on-dark)' }}>BTTakvim</span>
          </div>
          <p>Geleneksel günlük yaprak takvimi; tarih, namaz vakitleri ve kültür bir arada.</p>
          <form className="web-news" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="E-posta ile günün yaprağı" aria-label="E-posta" />
            <button type="submit"><PaperPlaneTilt size={16} weight="fill" color="var(--paper-1)" /></button>
          </form>
        </div>
        {COLS.map((c) => (
          <div key={c.b} className="web-footer-col">
            <span className="web-footer-h">{c.b}</span>
            {c.l.map((x) => <a key={x} href="#" onClick={(e) => e.preventDefault()}>{x}</a>)}
          </div>
        ))}
      </div>
      <div className="web-container web-footer-base">
        <span>© 2026 BTTakvim · Büyük Saatli Yaprak Takvimi</span>
        <span>Tasarım sistemi · v1.0</span>
      </div>
    </footer>
  );
}
