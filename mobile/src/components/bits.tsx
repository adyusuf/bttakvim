/** BTTakvim tasarım sistemi — paylaşılan küçük bileşenler (bt-bits karşılığı). */
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { FlowerLotus } from 'phosphor-react-native';
import { fonts, useTheme } from '@/lib/theme';

/** Büyük harf etiket — geniş harf aralığı (tracking-label 0.14em). */
export function Label({
  children,
  color,
  size = 11,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: TextStyle;
}) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: fonts.sansBold,
          fontSize: size,
          letterSpacing: size * 0.14,
          textTransform: 'uppercase',
          color: color ?? colors.ink2,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

/** Tezhip elması — 45° döndürülmüş küçük dolu kare. */
function Diamond({ s = 5, color }: { s?: number; color: string }) {
  return (
    <View
      style={{
        width: s,
        height: s,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
}

/** Altın tezhip ayracı: solan çizgi + elmas + lotus + elmas + solan çizgi. */
export function Ornament({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.ornamentRow, style]}>
      <View style={[styles.ornamentLine, { backgroundColor: colors.ruleGold }]} />
      <Diamond color={colors.gold0} />
      <FlowerLotus size={14} color={colors.gold0} weight="fill" />
      <Diamond color={colors.gold0} />
      <View style={[styles.ornamentLine, { backgroundColor: colors.ruleGold }]} />
    </View>
  );
}

/** Osmanlı 8 kollu yıldız mührü (geometrik rozet). */
export function Rosette({
  size = 38,
  color,
  strokeWidth = 1.2,
  style,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const c = color ?? colors.gold0;
  const pts = 16;
  const R = size / 2;
  const r = R * 0.46;
  let d = '';
  for (let i = 0; i < pts; i++) {
    const ang = (Math.PI / pts) * 2 * i - Math.PI / 2;
    const rad = i % 2 ? r : R - strokeWidth;
    d += (i ? 'L' : 'M') + (R + rad * Math.cos(ang)).toFixed(2) + ' ' + (R + rad * Math.sin(ang)).toFixed(2);
  }
  d += 'Z';
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Path d={d} fill="none" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" />
        <Circle cx={R} cy={R} r={R * 0.22} fill="none" stroke={c} strokeWidth={strokeWidth * 0.85} />
        <Circle cx={R} cy={R} r={R * 0.07} fill={c} />
      </Svg>
    </View>
  );
}

/** Mihrap kemeri (sivri/ogee niş) — kutuya esner. */
export function Arch({ color, strokeWidth = 1.5 }: { color?: string; strokeWidth?: number }) {
  const { colors } = useTheme();
  const d =
    'M3 100 L3 60 C3 30 24 14 42 7 C46 5.5 50 3 50 0 C50 3 54 5.5 58 7 C76 14 97 30 97 60 L97 100';
  return (
    <Svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}>
      <Path
        d={d}
        fill="none"
        stroke={color ?? colors.ruleGold}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </Svg>
  );
}

/** Arka yüz bölüm başlığı: mürekkep etiket sekmesi + noktalı çizgi + kırmızı italik başlık. */
export function SectionHead({
  etiket,
  baslik,
  icon,
}: {
  etiket: string;
  baslik: string;
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.surfaceInk,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 4,
          }}>
          {icon}
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 9.5,
              letterSpacing: 1.1,
              textTransform: 'uppercase',
              color: colors.paper1,
            }}>
            {etiket}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            borderBottomWidth: 1,
            borderStyle: 'dotted',
            borderColor: colors.ruleStrong,
            minWidth: 8,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: fonts.serifBoldItalic,
          fontSize: 20,
          color: colors.red0,
          marginTop: 6,
        }}>
        {baslik}
      </Text>
    </View>
  );
}

/** Krem panel kutusu (1px güçlü çizgi, 8px köşe). */
export function PanelBox({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: colors.ruleStrong,
          borderRadius: 8,
          backgroundColor: colors.surfaceCard,
          padding: 10,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

/** Takvim verileri satırı (Hicrî Yıl · 1447 gibi). */
export function StatRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string | number;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingVertical: 5,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.rule,
      }}>
      <Text
        style={{
          fontFamily: fonts.sansSemi,
          fontSize: 11,
          color: colors.ink2,
          letterSpacing: 0.2,
        }}>
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 13, color: colors.ink0 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ornamentRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  ornamentLine: { flex: 1, height: 1 },
});
