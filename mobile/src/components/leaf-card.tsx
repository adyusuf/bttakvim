import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fromIso, monthGrid, TURKISH_DAYS_SHORT } from '@/lib/dates';
import { colors } from '@/lib/theme';
import type { Leaf } from '@/lib/types';

interface Props {
  leaf: Leaf;
  onSelectDay?: (dayOfMonth: number) => void;
}

/** Yaprağın ön yüzü: tarihler, büyük gün, ay evresi, mini takvim. */
export function LeafCard({ leaf, onSelectDay }: Props) {
  const weeks = monthGrid(leaf.date);
  const selectedDay = leaf.day;
  const weekend = (col: number) => col >= 5;

  return (
    <View style={styles.card}>
      {/* Üst şerit: Hicri | Yıl/Ay/Gün | Rumi */}
      <View style={styles.topStrip}>
        <View style={styles.topCol}>
          <Text style={styles.topYear}>{leaf.hijri.year} Hicri</Text>
          <Text style={styles.topDetail}>
            {leaf.hijri.monthName} {leaf.hijri.day}
          </Text>
        </View>
        <View style={[styles.topCol, styles.topColMid]}>
          <Text style={styles.topDetail}>Yıl: {leaf.year}</Text>
          <Text style={styles.topDetail}>
            Ay: {fromIso(leaf.date).getMonth() + 1} · Gün: {leaf.dayOfYear}
          </Text>
        </View>
        <View style={[styles.topCol, styles.topColRight]}>
          <Text style={styles.topYear}>{leaf.rumi.year} Rumi</Text>
          <Text style={styles.topDetail}>
            {leaf.rumi.monthName} {leaf.rumi.day}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Ay adı + büyük gün + haftanın günü */}
      <Text style={styles.monthName}>{leaf.monthName.toLocaleUpperCase('tr')}</Text>
      <Text style={styles.bigDay}>{leaf.day}</Text>
      <Text style={styles.weekday}>{leaf.weekdayName.toLocaleUpperCase('tr')}</Text>
      {leaf.specialDay ? <Text style={styles.specialDay}>🎉 {leaf.specialDay}</Text> : null}

      {/* Dönem rozetleri */}
      <View style={styles.badges}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {leaf.seasonal.label}: {leaf.seasonal.day}
          </Text>
        </View>
        {leaf.coldPeriod ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {leaf.coldPeriod.label}: {leaf.coldPeriod.day}
            </Text>
          </View>
        ) : null}
        <View style={[styles.badge, styles.badgeMoon]}>
          <Text style={styles.badgeText}>
            {leaf.moon.emoji} {leaf.moon.name}
          </Text>
        </View>
      </View>

      {/* Mini ay takvimi */}
      <View style={styles.miniCal}>
        <View style={styles.miniRow}>
          {TURKISH_DAYS_SHORT.map((d, i) => (
            <Text
              key={d}
              style={[styles.miniHead, weekend(i) && styles.miniWeekend]}>
              {d}
            </Text>
          ))}
        </View>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.miniRow}>
            {week.map((day, ci) =>
              day === null ? (
                <Text key={ci} style={styles.miniCell} />
              ) : (
                <TouchableOpacity
                  key={ci}
                  style={[styles.miniCellWrap, day === selectedDay && styles.miniSelected]}
                  onPress={() => onSelectDay?.(day)}>
                  <Text
                    style={[
                      styles.miniCell,
                      weekend(ci) && styles.miniWeekend,
                      day === selectedDay && styles.miniSelectedText,
                    ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  topStrip: { flexDirection: 'row', justifyContent: 'space-between' },
  topCol: { flex: 1 },
  topColMid: { alignItems: 'center' },
  topColRight: { alignItems: 'flex-end' },
  topYear: { fontSize: 13, fontWeight: '700', color: colors.ink },
  topDetail: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 10 },
  monthName: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 10,
    color: colors.ink,
  },
  bigDay: {
    textAlign: 'center',
    fontSize: 110,
    lineHeight: 116,
    fontWeight: '900',
    color: colors.red,
    marginTop: -2,
  },
  weekday: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
    color: colors.ink,
    marginTop: -4,
  },
  specialDay: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.red,
    fontWeight: '700',
    marginTop: 6,
  },
  badges: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  badge: {
    backgroundColor: colors.paperShade,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeMoon: { backgroundColor: '#EFF3FA', borderColor: '#C9D6EA' },
  badgeText: { fontSize: 12, color: colors.ink, fontWeight: '600' },
  miniCal: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: colors.white,
  },
  miniRow: { flexDirection: 'row' },
  miniHead: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkSoft,
    paddingVertical: 2,
  },
  miniCellWrap: { flex: 1, alignItems: 'center', borderRadius: 6, paddingVertical: 2 },
  miniCell: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.ink, paddingVertical: 2 },
  miniWeekend: { color: colors.red },
  miniSelected: { backgroundColor: colors.red },
  miniSelectedText: { color: colors.white, fontWeight: '800' },
});
