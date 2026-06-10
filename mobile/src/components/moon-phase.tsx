/** Ay evresi — gerçek aydınlanma oranına göre çizilen SVG (illüstrasyon değil, veri). */
import React from 'react';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

export function MoonPhase({
  illum = 0.5,
  waxing = true,
  size = 40,
}: {
  illum?: number;
  waxing?: boolean;
  size?: number;
}) {
  const R = size / 2;
  const rx = R * Math.abs(1 - 2 * illum);
  const sweepTerm = illum > 0.5 ? 1 : 0;
  const litPath = `M 0 ${-R} A ${R} ${R} 0 0 1 0 ${R} A ${rx} ${R} 0 0 ${sweepTerm} 0 ${-R} Z`;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="moonlit" cx="38%" cy="34%" r="75%">
          <Stop offset="0%" stopColor="#FBF7EC" />
          <Stop offset="100%" stopColor="#E4DAC2" />
        </RadialGradient>
      </Defs>
      <G transform={`translate(${R} ${R})${waxing ? '' : ' scale(-1,1)'}`}>
        <Circle r={R} fill="#2B2417" />
        <Path d={litPath} fill="url(#moonlit)" />
        <Circle r={R - 0.5} fill="none" stroke="rgba(34,27,19,0.25)" strokeWidth={1} />
      </G>
    </Svg>
  );
}

/** Evre anahtarından büyüme yönü. */
export function isWaxing(key: string): boolean {
  return ['new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous'].includes(key);
}

/** Evre anahtarından almanak cümlesi ("Bu gece yarım ay büyüyor" gibi). */
export function moonSentence(key: string, name: string): string {
  switch (key) {
    case 'new_moon': return 'Bu gece Yeni Ay';
    case 'waxing_crescent': return 'Hilal büyüyor';
    case 'first_quarter': return 'Bu gece yarım ay büyüyor';
    case 'waxing_gibbous': return 'Ay dolunaya yaklaşıyor';
    case 'full_moon': return 'Bu gece Dolunay';
    case 'waning_gibbous': return 'Dolunay küçülmeye başladı';
    case 'last_quarter': return 'Ay son dördününde küçülüyor';
    case 'waning_crescent': return 'Hilal inceliyor';
    default: return name;
  }
}
