/** İnteraktif harita — soyut parşömen zemin + noktalı rota + tıklanabilir iğneler. */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { MapTrifold } from 'phosphor-react-native';
import { Label } from '@/components/bits';
import { fonts, useTheme } from '@/lib/theme';
import type { MapData } from '@/lib/types';

export function InteractiveMap({ harita }: { harita: MapData }) {
  const { colors } = useTheme();
  const [secili, setSecili] = useState(0);
  const N = harita.noktalar;
  const rotaStr = harita.rota.map((i) => `${N[i].x},${N[i].y}`).join(' ');
  const s = N[secili];

  return (
    <View
      style={{
        marginVertical: 14,
        borderWidth: 1,
        borderColor: colors.ruleStrong,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.paper2,
      }}>
      <View style={{ paddingHorizontal: 13, paddingTop: 10, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MapTrifold size={12} color={colors.blue0} weight="fill" />
          <Label size={9.5} color={colors.blue0}>
            {harita.baslik}
          </Label>
        </View>
        <Text style={{ fontFamily: fonts.sans, fontSize: 10.5, color: colors.ink3, marginTop: 3 }}>
          {harita.altyazi}
        </Text>
      </View>
      <View style={{ backgroundColor: '#E2EAE6' }}>
        <Svg viewBox="0 0 100 64" style={{ width: '100%', aspectRatio: 100 / 64 }}>
          <Path d="M-2 30 Q 14 18 30 24 T 60 22 Q 78 20 102 30 L 102 66 L -2 66 Z" fill="#D8D0B6" opacity={0.55} />
          <Path d="M10 40 Q 30 32 52 38 T 96 40 L 96 66 L 10 66 Z" fill="#C9BE9C" opacity={0.5} />
          {[16, 32, 48].map((y) => (
            <Line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke="rgba(34,27,19,0.06)" strokeWidth={0.4} />
          ))}
          {[25, 50, 75].map((x) => (
            <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={64} stroke="rgba(34,27,19,0.06)" strokeWidth={0.4} />
          ))}
          <Polyline
            points={rotaStr}
            fill="none"
            stroke={colors.red0}
            strokeWidth={0.9}
            strokeDasharray="2 1.6"
            strokeLinecap="round"
            opacity={0.8}
          />
          {N.map((n, i) => {
            const sec = i === secili;
            return (
              <G key={i} onPress={() => setSecili(i)}>
                <Circle cx={n.x} cy={n.y} r={sec ? 6 : 4.5} fill="rgba(158,27,30,0.14)" />
                <Circle
                  cx={n.x}
                  cy={n.y}
                  r={sec ? 3 : 2.2}
                  fill={sec ? colors.red0 : colors.ink1}
                  stroke="#FFFFFF"
                  strokeWidth={0.7}
                />
                <SvgText
                  x={n.x}
                  y={n.y - 5}
                  textAnchor="middle"
                  fontSize={sec ? 3.6 : 3}
                  fontWeight="700"
                  fill={sec ? colors.red0 : colors.ink1}>
                  {n.ad}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
      <View
        style={{
          paddingHorizontal: 13,
          paddingVertical: 11,
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
          backgroundColor: colors.surfaceCard,
          borderTopWidth: 1,
          borderTopColor: colors.rule,
        }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.red0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontFamily: fonts.displayX, fontSize: 13, color: '#FFFFFF' }}>{secili + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 14, color: colors.ink0 }}>{s.ad}</Text>
          <Text style={{ fontFamily: fonts.serif, fontSize: 13, lineHeight: 19, color: colors.ink1, marginTop: 2 }}>
            {s.not}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Slug'a göre demo harita verisi — backend harita desteği gelene kadar mock. */
export const DEMO_MAPS: Record<string, MapData> = {
  'istanbulun-fethi': {
    baslik: 'Kuşatmanın Coğrafyası — 1453',
    altyazi: 'Bir noktaya dokunarak detayları görün',
    noktalar: [
      { x: 30, y: 26, ad: 'Edirne', not: 'Sefer hazırlıklarının yürütüldüğü Osmanlı başkenti.' },
      { x: 62, y: 40, ad: 'Rumeli Hisarı', not: "1452'de Boğaz'ı kontrol için yalnızca dört ayda inşa edildi." },
      { x: 70, y: 52, ad: 'Haliç', not: 'Gemilerin karadan yürütülerek indirildiği koy.' },
      { x: 74, y: 60, ad: 'Topkapı Surları', not: 'Son hücumun yapıldığı ve şehre girilen nokta.' },
    ],
    rota: [0, 1, 2, 3],
  },
  'piri-reis-haritasi': {
    baslik: 'Piri Reis Haritasının Yolculuğu',
    altyazi: 'Bir durağa dokunarak detayları görün',
    noktalar: [
      { x: 18, y: 30, ad: 'Gelibolu', not: 'Piri Reis’in doğduğu ve denizciliği öğrendiği liman.' },
      { x: 44, y: 44, ad: 'Akdeniz', not: 'Kitab-ı Bahriye’ye temel olan seferlerin coğrafyası.' },
      { x: 70, y: 36, ad: 'Kahire', not: 'Haritanın 1517’de Yavuz Sultan Selim’e sunulduğu şehir.' },
      { x: 56, y: 18, ad: 'İstanbul', not: 'Haritanın 1929’da Topkapı Sarayı’nda bulunduğu yer.' },
    ],
    rota: [0, 1, 2, 3],
  },
};
