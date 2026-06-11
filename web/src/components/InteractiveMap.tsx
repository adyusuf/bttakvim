import { MapTrifold } from '@phosphor-icons/react';
import { useState } from 'react';
import type { MapData } from './InteractiveMap.data';

export function InteractiveMap({ harita }: { harita: MapData }) {
  const [secili, setSecili] = useState(0);
  const N = harita.noktalar;
  const rotaStr = harita.rota.map((i) => `${N[i].x},${N[i].y}`).join(' ');
  const s = N[secili];
  return (
    <div style={{ border: '1px solid var(--rule-strong)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--paper-2)' }}>
      <div style={{ padding: '12px 16px 8px' }}>
        <span className="web-label" style={{ fontSize: 11, color: 'var(--blue-0)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <MapTrifold size={14} weight="fill" color="var(--blue-0)" />{harita.baslik}
        </span>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-faint)', marginTop: 3 }}>{harita.altyazi}</div>
      </div>
      <div style={{ background: '#E2EAE6' }}>
        <svg viewBox="0 0 100 64" style={{ display: 'block', width: '100%' }}>
          <path d="M-2 30 Q 14 18 30 24 T 60 22 Q 78 20 102 30 L 102 66 L -2 66 Z" fill="#D8D0B6" opacity={0.55} />
          <path d="M10 40 Q 30 32 52 38 T 96 40 L 96 66 L 10 66 Z" fill="#C9BE9C" opacity={0.5} />
          {[16, 32, 48].map((y) => <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke="rgba(34,27,19,0.06)" strokeWidth={0.4} />)}
          {[25, 50, 75].map((x) => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={64} stroke="rgba(34,27,19,0.06)" strokeWidth={0.4} />)}
          <polyline points={rotaStr} fill="none" stroke="var(--accent)" strokeWidth={0.9} strokeDasharray="2 1.6" strokeLinecap="round" opacity={0.8} />
          {N.map((n, i) => {
            const sec = i === secili;
            return (
              <g key={i} onClick={() => setSecili(i)} style={{ cursor: 'pointer' }}>
                <circle cx={n.x} cy={n.y} r={sec ? 6 : 4.5} fill="rgba(158,27,30,0.14)" />
                <circle cx={n.x} cy={n.y} r={sec ? 3 : 2.2} fill={sec ? 'var(--accent)' : 'var(--ink-1)'} stroke="#fff" strokeWidth={0.7} />
                <text x={n.x} y={n.y - 5} textAnchor="middle" fontSize={sec ? 3.6 : 3} fontWeight={700} fill={sec ? 'var(--accent)' : 'var(--ink-1)'}>{n.ad}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--surface-card)', borderTop: '1px solid var(--rule)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>{secili + 1}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 15, color: 'var(--ink-0)' }}>{s.ad}</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.45, color: 'var(--text-secondary)', marginTop: 2 }}>{s.not}</div>
        </div>
      </div>
    </div>
  );
}
