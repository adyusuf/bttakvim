import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@/lib/theme';
import type { PrayerTimes } from '@/lib/types';

interface Props {
  prayer: PrayerTimes | null;
  loading: boolean;
  usingGps: boolean;
  onPressLocation: () => void;
}

const LABELS: { key: keyof PrayerTimes['times']; label: string }[] = [
  { key: 'imsak', label: 'İmsak' },
  { key: 'gunes', label: 'Güneş' },
  { key: 'ogle', label: 'Öğle' },
  { key: 'ikindi', label: 'İkindi' },
  { key: 'aksam', label: 'Akşam' },
  { key: 'yatsi', label: 'Yatsı' },
];

/** Namaz vakitleri tablosu — konuma bağlı, her istekte sunucudan hesaplanır. */
export function PrayerTable({ prayer, loading, usingGps, onPressLocation }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Namaz Vakitleri</Text>
        <TouchableOpacity style={styles.cityButton} onPress={onPressLocation}>
          <Text style={styles.cityButtonText}>
            {usingGps ? '📡 ' : '📍 '}
            {prayer?.cityName ?? '...'} ▾
          </Text>
        </TouchableOpacity>
      </View>

      {loading || !prayer ? (
        <ActivityIndicator color={colors.red} style={{ marginVertical: 18 }} />
      ) : (
        <>
          <View style={styles.row}>
            {LABELS.map(({ key, label }) => (
              <View key={key} style={styles.cell}>
                <Text style={styles.cellLabel}>{label}</Text>
                <Text style={styles.cellTime}>{prayer.times[key]}</Text>
              </View>
            ))}
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>☀️ Gündüz {prayer.dayLength}</Text>
            <Text style={styles.footerText}>🌙 Gece {prayer.nightLength}</Text>
            <Text style={styles.footerText}>🕋 Kıble {prayer.qiblaTime}</Text>
          </View>
          <Text style={styles.delta}>
            Günün uzaması: {prayer.dayLengthDeltaMinutes >= 0 ? '+' : ''}
            {prayer.dayLengthDeltaMinutes} dakika
            {prayer.source.startsWith('mock') ? '  ·  (mock veri)' : ''}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginTop: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '800', color: colors.ink },
  cityButton: {
    backgroundColor: colors.red,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cityButtonText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  row: { flexDirection: 'row', marginTop: 12 },
  cell: { flex: 1, alignItems: 'center' },
  cellLabel: { fontSize: 11, color: colors.inkSoft, fontWeight: '700' },
  cellTime: { fontSize: 13, color: colors.ink, fontWeight: '800', marginTop: 3 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: colors.paperShade,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  footerText: { fontSize: 11.5, color: colors.ink, fontWeight: '600' },
  delta: { fontSize: 11, color: colors.inkSoft, marginTop: 6, textAlign: 'center' },
});
