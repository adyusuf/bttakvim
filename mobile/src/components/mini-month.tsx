/** Mini ay takvimi — Pazartesi başlangıç, Pazar kırmızı, aktif gün dolu daire. */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { fonts, useTheme } from '@/lib/theme';

export function MiniMonth({
  year,
  month,
  day,
  onSelectDay,
}: {
  year: number;
  month: number;
  day: number;
  onSelectDay?: (d: number) => void;
}) {
  const { colors } = useTheme();
  const headers = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Pazar
  const offset = (firstDow + 6) % 7;
  const dayCount = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= dayCount; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      <View style={{ flexDirection: 'row', marginBottom: 3 }}>
        {headers.map((h, i) => (
          <Text
            key={h}
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: fonts.sansBold,
              fontSize: 9,
              color: i === 6 ? colors.red0 : colors.ink2,
              paddingBottom: 2,
            }}>
            {h}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, w) => (
        <View key={w} style={{ flexDirection: 'row' }}>
          {cells.slice(w * 7, w * 7 + 7).map((d, i) => {
            const sunday = i === 6;
            const active = d === day;
            return (
              <TouchableOpacity
                key={i}
                disabled={!d || !onSelectDay}
                onPress={() => d && onSelectDay?.(d)}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.red0 : 'transparent',
                  borderRadius: 999,
                }}>
                <Text
                  style={{
                    fontFamily: active ? fonts.sansBold : fonts.sansMedium,
                    fontSize: 10,
                    color: active ? colors.textOnRed : sunday ? colors.red0 : colors.ink1,
                  }}>
                  {d ?? ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
