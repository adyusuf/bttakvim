import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CityPicker } from '@/components/city-picker';
import { ContentCards } from '@/components/content-cards';
import { LeafCard } from '@/components/leaf-card';
import { PrayerTable } from '@/components/prayer-table';
import {
  fetchCities,
  fetchLeaf,
  fetchPrayerTimes,
  getSavedCity,
  saveCity,
} from '@/lib/api';
import { addDays, fromIso, toIso, todayIso } from '@/lib/dates';
import { colors } from '@/lib/theme';
import type { CityRef, Leaf, PrayerTimes } from '@/lib/types';

type LocationMode =
  | { kind: 'city'; slug: string }
  | { kind: 'gps'; lat: number; lng: number };

export default function CalendarScreen() {
  const [dateIso, setDateIso] = useState(todayIso());
  const [leaf, setLeaf] = useState<Leaf | null>(null);
  const [offline, setOffline] = useState(false);
  const [leafLoading, setLeafLoading] = useState(true);

  const [prayer, setPrayer] = useState<PrayerTimes | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [locationMode, setLocationMode] = useState<LocationMode>({
    kind: 'city',
    slug: 'istanbul',
  });

  const [cities, setCities] = useState<CityRef[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // İlk açılış: kayıtlı şehir tercihi + şehir listesi
  useEffect(() => {
    (async () => {
      const [savedCity, cityList] = await Promise.all([getSavedCity(), fetchCities()]);
      setCities(cityList);
      if (savedCity) setLocationMode({ kind: 'city', slug: savedCity });
    })();
  }, []);

  const loadLeaf = useCallback(async (iso: string) => {
    setLeafLoading(true);
    const result = await fetchLeaf(iso);
    setLeaf(result.leaf);
    setOffline(result.offline);
    setLeafLoading(false);
  }, []);

  const loadPrayer = useCallback(async (iso: string, mode: LocationMode) => {
    setPrayerLoading(true);
    const result = await fetchPrayerTimes(
      iso,
      mode.kind === 'city'
        ? { citySlug: mode.slug }
        : { lat: mode.lat, lng: mode.lng },
    );
    setPrayer(result);
    setPrayerLoading(false);
  }, []);

  useEffect(() => {
    loadLeaf(dateIso);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [dateIso, loadLeaf]);

  useEffect(() => {
    loadPrayer(dateIso, locationMode);
  }, [dateIso, locationMode, loadPrayer]);

  const goDay = useCallback((delta: number) => {
    setDateIso((d) => addDays(d, delta));
  }, []);

  // Yaprak üzerinde sağa/sola kaydırarak gün değiştirme
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_e, g) => {
          if (g.dx <= -40) goDay(1);
          else if (g.dx >= 40) goDay(-1);
        },
      }),
    [goDay],
  );

  const useGps = useCallback(async () => {
    setPickerVisible(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Konum izni verilmedi', 'Şehir listesinden seçim yapabilirsiniz.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setLocationMode({ kind: 'gps', lat: pos.coords.latitude, lng: pos.coords.longitude });
  }, []);

  const selectCity = useCallback((slug: string) => {
    setPickerVisible(false);
    setLocationMode({ kind: 'city', slug });
    saveCity(slug);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadLeaf(dateIso), loadPrayer(dateIso, locationMode)]);
    setRefreshing(false);
  }, [dateIso, locationMode, loadLeaf, loadPrayer]);

  const isToday = dateIso === todayIso();
  const headerDate = useMemo(() => {
    const d = fromIso(dateIso);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [dateIso]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Başlık + gün gezinme */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => goDay(-1)}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>BTTakvim</Text>
          <Text style={styles.headerDate}>{headerDate}</Text>
        </View>
        <TouchableOpacity style={styles.navButton} onPress={() => goDay(1)}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {!isToday ? (
        <TouchableOpacity style={styles.todayPill} onPress={() => setDateIso(todayIso())}>
          <Text style={styles.todayPillText}>Bugüne dön</Text>
        </TouchableOpacity>
      ) : null}

      {offline ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚠️ Sunucuya ulaşılamadı — örnek (mock) yaprak gösteriliyor
          </Text>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {leafLoading || !leaf ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.red} />
            <Text style={styles.loadingText}>Yaprak hazırlanıyor…</Text>
          </View>
        ) : (
          <View {...panResponder.panHandlers}>
            <LeafCard
              leaf={leaf}
              onSelectDay={(day) => {
                const d = fromIso(dateIso);
                d.setDate(day);
                setDateIso(toIso(d));
              }}
            />
            <PrayerTable
              prayer={prayer}
              loading={prayerLoading}
              usingGps={locationMode.kind === 'gps'}
              onPressLocation={() => setPickerVisible(true)}
            />
            <ContentCards leaf={leaf} />
            <Text style={styles.footerNote}>
              Bu yaprak ilk ziyarette üretildi ve bir daha değişmez · BTTakvim
            </Text>
          </View>
        )}
      </ScrollView>

      <CityPicker
        visible={pickerVisible}
        cities={cities}
        selectedSlug={locationMode.kind === 'city' ? locationMode.slug : null}
        usingGps={locationMode.kind === 'gps'}
        onSelectCity={selectCity}
        onUseGps={useGps}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.red,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  headerDate: { color: '#FBD9DC', fontSize: 12.5, fontWeight: '600', marginTop: 1 },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.redDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: { color: colors.white, fontSize: 26, fontWeight: '800', marginTop: -3 },
  todayPill: {
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 8,
  },
  todayPillText: { color: colors.white, fontSize: 12.5, fontWeight: '700' },
  offlineBanner: {
    backgroundColor: '#FFF2CC',
    borderBottomWidth: 1,
    borderColor: '#E5C75A',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  offlineText: { fontSize: 12, color: '#7A5B00', textAlign: 'center', fontWeight: '600' },
  scroll: { padding: 12, paddingBottom: 32 },
  loading: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, color: colors.inkSoft, fontWeight: '600' },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 16,
  },
});
