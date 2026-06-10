/** Gece-gündüz kadranı — gündüz oranını altın yay ile gösteren SVG halkası. */
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Sun } from 'phosphor-react-native';
import { fonts, useTheme } from '@/lib/theme';

export function DayNightDial({
  dayFraction = 0.4,
  dayText = '',
  size = 92,
}: {
  dayFraction?: number;
  dayText?: string;
  size?: number;
}) {
  const { colors } = useTheme();
  const R = size / 2;
  const stroke = 9;
  const r = R - stroke / 2 - 1;
  const C = 2 * Math.PI * r;
  const dayLen = C * dayFraction;
  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={R} cy={R} r={r} fill="none" stroke={colors.ink1} strokeWidth={stroke} />
        <Circle
          cx={R}
          cy={R}
          r={r}
          fill="none"
          stroke={colors.gold1}
          strokeWidth={stroke}
          strokeDasharray={`${dayLen} ${C - dayLen}`}
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}>
        <Sun size={15} color={colors.gold0} weight="fill" />
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 9,
            color: colors.ink1,
            textAlign: 'center',
            lineHeight: 11,
          }}>
          GÜNDÜZ{'\n'}
          <Text style={{ color: colors.ink0 }}>{dayText}</Text>
        </Text>
      </View>
    </View>
  );
}
