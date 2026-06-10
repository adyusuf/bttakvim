/** Namaz vakitleri şeridi — 6 vakit, sıradaki vakit İznik yeşili ile dolu. */
import React from 'react';
import { Text, View } from 'react-native';
import {
  Cloud,
  CloudSun,
  Moon,
  MoonStars,
  Sun,
  SunHorizon,
} from 'phosphor-react-native';
import { fonts, useTheme } from '@/lib/theme';
import type { PrayerTimes } from '@/lib/types';

export const VAKIT_TANIM = [
  { key: 'imsak', ad: 'İmsak', Ikon: MoonStars },
  { key: 'gunes', ad: 'Güneş', Ikon: SunHorizon },
  { key: 'ogle', ad: 'Öğle', Ikon: Sun },
  { key: 'ikindi', ad: 'İkindi', Ikon: CloudSun },
  { key: 'aksam', ad: 'Akşam', Ikon: SunHorizon },
  { key: 'yatsi', ad: 'Yatsı', Ikon: Moon },
] as const;

export type VakitKey = (typeof VAKIT_TANIM)[number]['key'];

/** Bugün için sıradaki vakit; bugün değilse null. */
export function nextVakit(prayer: PrayerTimes, todayIso: string): VakitKey | null {
  if (prayer.date !== todayIso) return null;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const v of VAKIT_TANIM) {
    const [h, m] = prayer.times[v.key].split(':').map(Number);
    if (h * 60 + m > mins) return v.key;
  }
  return 'imsak';
}

export function VakitSerit({
  prayer,
  siradaki,
}: {
  prayer: PrayerTimes;
  siradaki: VakitKey | null;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {VAKIT_TANIM.map(({ key, ad, Ikon }) => {
        const aktif = key === siradaki;
        return (
          <View
            key={key}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 4,
              paddingVertical: 8,
              paddingHorizontal: 2,
              borderRadius: 8,
              backgroundColor: aktif ? colors.green0 : colors.surfaceSunken,
            }}>
            <Ikon
              size={15}
              weight={aktif ? 'fill' : 'regular'}
              color={aktif ? colors.gold2 : colors.green0}
            />
            <Text
              style={{
                fontFamily: fonts.sansSemi,
                fontSize: 9,
                color: aktif ? colors.textOnDark : colors.ink1,
              }}>
              {ad}
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 13,
                color: aktif ? '#FFFFFF' : colors.ink0,
              }}>
              {prayer.times[key]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
