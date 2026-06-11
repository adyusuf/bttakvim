import { CaretLeft, CaretRight, Note, NotePencil } from 'phosphor-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeafBack } from '@/components/leaf-back';
import { LeafCard } from '@/components/leaf-card';
import { LeafFront } from '@/components/leaf-front';
import { fetchLeaf, fetchPrayerTimes } from '@/lib/api';
import { useAppState } from '@/lib/app-state';
import { addDays, fromIso, toIso, todayIso } from '@/lib/dates';
import { fonts, useTheme } from '@/lib/theme';
import type { Leaf, PrayerTimes } from '@/lib/types';

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLocaleLowerCase('tr');

function NavBtn({ left, disabled, onPress }: { left?: boolean; disabled?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const Ikon = left ? CaretLeft : CaretRight;
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: colors.ruleStrong,
        backgroundColor: colors.surfaceCard,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      }}>
      <Ikon size={17} weight="bold" color={colors.ink1} />
    </TouchableOpacity>
  );
}

function Segmented({
  flipped,
  onChange,
}: {
  flipped: boolean;
  onChange: (flipped: boolean) => void;
}) {
  const { colors } = useTheme();
  const options = [
    { val: false, label: 'Ön yüz', Ikon: Note },
    { val: true, label: 'Arka yüz', Ikon: NotePencil },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceSunken,
        borderRadius: 999,
        padding: 3,
        borderWidth: 1,
        borderColor: colors.rule,
      }}>
      {options.map(({ val, label, Ikon }) => {
        const aktif = val === flipped;
        return (
          <TouchableOpacity
            key={label}
            onPress={() => onChange(val)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: aktif ? colors.surfaceCard : 'transparent',
            }}>
            <Ikon size={14} weight={aktif ? 'fill' : 'regular'} color={aktif ? colors.red0 : colors.ink2} />
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 12.5,
                color: aktif ? colors.red0 : colors.ink2,
              }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TakvimScreen() {
  const { colors } = useTheme();
  const { cities, location, selectCity, useGps } = useAppState();

  const [dateIso, setDateIso] = useState(todayIso());
  const [flipped, setFlipped] = useState(false);

  // Yaprak verisi, hangi tarih için yüklendiği bilgisiyle birlikte tutulur;
  // yükleniyor durumu bu anahtar ile istenen tarih karşılaştırılarak render'da türetilir.
  const [leafState, setLeafState] = useState<{ key: string; leaf: Leaf; offline: boolean } | null>(null);
  const leaf = leafState?.leaf ?? null;
  const offline = leafState?.offline ?? false;
  const leafLoading = leafState?.key !== dateIso;

  // Vakit verisi, hangi tarih+konum için yüklendiği bilgisiyle birlikte tutulur.
  const prayerKey = `${dateIso}|${
    location.kind === 'city' ? location.slug : `${location.lat},${location.lng}`
  }`;
  const [prayerState, setPrayerState] = useState<{ key: string; prayer: PrayerTimes } | null>(null);
  const prayer = prayerState?.prayer ?? null;
  const prayerLoading = prayerState?.key !== prayerKey;

  useEffect(() => {
    let alive = true;
    fetchLeaf(dateIso).then((r) => {
      if (!alive) return;
      setLeafState({ key: dateIso, leaf: r.leaf, offline: r.offline });
    });
    return () => {
      alive = false;
    };
  }, [dateIso]);

  useEffect(() => {
    let alive = true;
    fetchPrayerTimes(
      dateIso,
      location.kind === 'city' ? { citySlug: location.slug } : { lat: location.lat, lng: location.lng },
    ).then((r) => {
      if (!alive) return;
      setPrayerState({ key: prayerKey, prayer: r });
    });
    return () => {
      alive = false;
    };
  }, [dateIso, location, prayerKey]);

  const goDay = useCallback((delta: number) => {
    setDateIso((d) => addDays(d, delta));
    setFlipped(false);
  }, []);

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

  const isToday = dateIso === todayIso();
  const d = fromIso(dateIso);
  const headerDate = leaf
    ? `${leaf.day} ${titleCase(leaf.monthName)} ${leaf.year}`
    : dateIso;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceApp }} edges={['top']}>
      {/* Başlık + gün gezinme */}
      <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <NavBtn left onPress={() => goDay(-1)} />
          <TouchableOpacity onPress={() => !isToday && (setDateIso(todayIso()), setFlipped(false))}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.displayX, fontSize: 16, color: colors.ink0 }}>
                {headerDate}
              </Text>
              <Text style={{ fontFamily: fonts.sansSemi, fontSize: 11.5, color: colors.ink2 }}>
                {leaf ? titleCase(leaf.weekdayName) : ''}
                {isToday ? ' · Bugün' : '  ·  Bugüne dön'}
              </Text>
            </View>
          </TouchableOpacity>
          <NavBtn onPress={() => goDay(1)} />
        </View>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Segmented flipped={flipped} onChange={setFlipped} />
        </View>
      </View>

      {offline ? (
        <View
          style={{
            backgroundColor: colors.goldWash,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.ruleGold,
            paddingVertical: 5,
          }}>
          <Text
            style={{
              textAlign: 'center',
              fontFamily: fonts.sansSemi,
              fontSize: 11.5,
              color: colors.gold0,
            }}>
            Sunucuya ulaşılamadı — örnek yaprak gösteriliyor
          </Text>
        </View>
      ) : null}

      {/* Yaprak */}
      <View
        style={{ flex: 1, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 14 }}
        {...panResponder.panHandlers}>
        {leafLoading || !leaf ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={colors.red0} />
            <Text style={{ fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink2 }}>
              Yaprak hazırlanıyor…
            </Text>
          </View>
        ) : (
          <LeafCard
            flipped={flipped}
            onFlip={() => setFlipped(!flipped)}
            front={
              <LeafFront
                leaf={leaf}
                prayer={prayer}
                prayerLoading={prayerLoading}
                location={{
                  cities,
                  citySlug: location.kind === 'city' ? location.slug : null,
                  usingGps: location.kind === 'gps',
                  onSelectCity: selectCity,
                  onUseGps: useGps,
                }}
                onSelectDay={(day) => {
                  const nd = new Date(d.getFullYear(), d.getMonth(), day);
                  setDateIso(toIso(nd));
                  setFlipped(false);
                }}
              />
            }
            back={<LeafBack leaf={leaf} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
