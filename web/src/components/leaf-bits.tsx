/** BTTakvim — yaprak SVG süsleme & veri öğeleri (web). */
import { TURKISH_MONTHS } from '../lib/dates';

export function Rosette({ size = 38, color = 'var(--ornament)', strokeWidth = 1.2 }: {
  size?: number; color?: string; strokeWidth?: number;
}) {
  const pts = 16, R = size / 2, r = R * 0.46;
  let d = '';
  for (let i = 0; i < pts; i++) {
    const ang = (Math.PI / pts) * 2 * i - Math.PI / 2;
    const rad = i % 2 ? r : R - strokeWidth;
    d += (i ? 'L' : 'M') + (R + rad * Math.cos(ang)).toFixed(2) + ' ' + (R + rad * Math.sin(ang)).toFixed(2);
  }
  d += 'Z';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <circle cx={R} cy={R} r={R * 0.22} fill="none" stroke={color} strokeWidth={strokeWidth * 0.85} />
      <circle cx={R} cy={R} r={R * 0.07} fill={color} />
    </svg>
  );
}

export function Arch({ color = 'var(--rule-gold)', strokeWidth = 1.5 }: { color?: string; strokeWidth?: number }) {
  const d = 'M3 100 L3 60 C3 30 24 14 42 7 C46 5.5 50 3 50 0 C50 3 54 5.5 58 7 C76 14 97 30 97 60 L97 100';
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%' }} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function MoonPhase({ illum = 0.5, waxing = true, size = 38 }: { illum?: number; waxing?: boolean; size?: number }) {
  const R = size / 2;
  const rx = R * Math.abs(1 - 2 * illum);
  const sweep = illum > 0.5 ? 1 : 0;
  const lit = `M 0 ${-R} A ${R} ${R} 0 0 1 0 ${R} A ${rx} ${R} 0 0 ${sweep} 0 ${-R} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="moonlit" cx="38%" cy="34%" r="75%">
          <stop offset="0%" stopColor="#FBF7EC" />
          <stop offset="100%" stopColor="#E4DAC2" />
        </radialGradient>
      </defs>
      <g transform={`translate(${R} ${R}) ${waxing ? '' : 'scale(-1,1)'}`}>
        <circle r={R} fill="#2B2417" />
        <path d={lit} fill="url(#moonlit)" />
        <circle r={R - 0.5} fill="none" stroke="rgba(34,27,19,0.25)" strokeWidth={1} />
      </g>
    </svg>
  );
}

export function DayNightDial({ dayFraction = 0.4, dayText = '', size = 92 }: {
  dayFraction?: number; dayText?: string; size?: number;
}) {
  const R = size / 2, stroke = 9, r = R - stroke / 2 - 1;
  const C = 2 * Math.PI * r;
  const dayLen = C * dayFraction;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={R} cy={R} r={r} fill="none" stroke="var(--ink-1)" strokeWidth={stroke} />
        <circle cx={R} cy={R} r={r} fill="none" stroke="var(--gold-1)" strokeWidth={stroke} strokeDasharray={`${dayLen} ${C - dayLen}`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>
          GÜNDÜZ<br /><span style={{ color: 'var(--ink-0)' }}>{dayText}</span>
        </span>
      </div>
    </div>
  );
}

export function MiniMonth({ year, month, day }: { year: number; month: number; day: number }) {
  const headers = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset = (firstDow + 6) % 7;
  const dayCount = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= dayCount; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, marginBottom: 3 }}>
        {headers.map((b, i) => (
          <div key={b} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: i === 6 ? 'var(--accent)' : 'var(--text-muted)', paddingBottom: 2 }}>{b}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
        {cells.map((d, i) => {
          const sunday = i % 7 === 6, active = d === day;
          return (
            <div key={i} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: active ? 800 : 500, borderRadius: '50%',
              color: active ? 'var(--text-on-red)' : sunday ? 'var(--accent)' : 'var(--text-secondary)',
              background: active ? 'var(--accent)' : 'transparent',
            }}>{d ?? ''}</div>
          );
        })}
      </div>
    </div>
  );
}

export { TURKISH_MONTHS };
