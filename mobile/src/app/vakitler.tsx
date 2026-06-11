/** Vakitler — şehir cipsleri, sıradaki vakit kartı ve tam liste. */
import { Compass } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Label } from '@/components/bits';
import { nextVakit, VAKIT_TANIM } from '@/components/vakit-serit';
import { fetchPrayerTimes } from '@/lib/api';
import { useAppState } from '@/lib/app-state';
import { todayIso } from '@/lib/dates';
import { fonts, useTheme } from '@/lib/theme';
import type { PrayerTimes } from '@/lib/types';

function remainingText(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  let diff = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
  if (diff < 0) diff += 1440;
  const sh = Math.floor(diff / 60);
  const sm = diff % 60;
  return sh > 0 ? `${sh} saat ${sm} dakika kaldı` : `${sm} dakika kaldı`;
}

export default function VakitlerScreen() {
  const { colors } = useTheme();
  const { cities, location, selectCity, useGps, cityName } = useAppState();

  // Vakitler, hangi konum için yüklendiği bilgisiyle birlikte tutulur; konum
  // değişince eski veri (key uyuşmazlığı) otomatik olarak null'a düşer ve spinner görünür.
  const locationKey =
    location.kind === 'city' ? `city:${location.slug}` : `gps:${location.lat},${location.lng}`;
  const [prayerState, setPrayerState] = useState<{ key: string; prayer: PrayerTimes } | null>(null);
  const prayer = prayerState?.key === locationKey ? prayerState.prayer : null;

  useEffect(() => {
    let alive = true;
    fetchPrayerTimes(
      todayIso(),
      location.kind === 'city' ? { citySlug: location.slug } : { lat: location.lat, lng: location.lng },
    ).then((r) => {
      if (!alive) return;
      setPrayerState({ key: locationKey, prayer: r });
    });
    return () => {
      alive = false;
    };
  }, [location, locationKey]);

  const siradaki = prayer ? nextVakit(prayer, todayIso()) : null;
  const siradakiTanim = VAKIT_TANIM.find((v) => v.key === siradaki);
  const tarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceApp }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }}>
        <Text style={{ fontFamily: fonts.displayX, fontSize: 28, color: colors.ink0, marginTop: 4 }}>
          Namaz Vakitleri
        </Text>
        <Text style={{ fontFamily: fonts.serifItalic, fontSize: 13.5, color: colors.ink2, marginBottom: 14, marginTop: 2 }}>
          {tarih} · {prayer?.cityName ?? cityName}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7, paddingBottom: 12 }}>
          <TouchableOpacity
            onPress={useGps}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: location.kind === 'gps' ? colors.green0 : colors.ruleStrong,
              backgroundColor: location.kind === 'gps' ? colors.green0 : 'transparent',
            }}>
            <Text
              style={{
                fontFamily: fonts.sansSemi,
                fontSize: 12.5,
                color: location.kind === 'gps' ? colors.textOnDark : colors.ink1,
              }}>
              Konumum
            </Text>
          </TouchableOpacity>
          {cities.map((c) => {
            const aktif = location.kind === 'city' && c.slug === location.slug;
            return (
              <TouchableOpacity
                key={c.slug}
                onPress={() => selectCity(c.slug)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: aktif ? colors.green0 : colors.ruleStrong,
                  backgroundColor: aktif ? colors.green0 : 'transparent',
                }}>
                <Text
                  style={{
                    fontFamily: fonts.sansSemi,
                    fontSize: 12.5,
                    color: aktif ? colors.textOnDark : colors.ink1,
                  }}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {!prayer ? (
          <ActivityIndicator color={colors.green0} style={{ marginVertical: 40 }} size="large" />
        ) : (
          <>
            {/* Sıradaki vakit */}
            {siradakiTanim ? (
              <View
                style={{
                  backgroundColor: colors.green0,
                  borderRadius: 16,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  marginBottom: 16,
                }}>
                <Label size={10} color={colors.greenWash}>
                  Sıradaki Vakit
                </Label>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginTop: 6,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <siradakiTanim.Ikon size={32} color={colors.gold2} weight="fill" />
                    <View>
                      <Text style={{ fontFamily: fonts.displayX, fontSize: 26, color: colors.textOnDark, lineHeight: 28 }}>
                        {siradakiTanim.ad}
                      </Text>
                      <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.greenWash, marginTop: 3 }}>
                        {remainingText(prayer.times[siradakiTanim.key])}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: fonts.displayX, fontSize: 30, color: colors.textOnDark }}>
                    {prayer.times[siradakiTanim.key]}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Tüm vakitler */}
            <View
              style={{
                backgroundColor: colors.surfaceCard,
                borderWidth: 1,
                borderColor: colors.rule,
                borderRadius: 16,
                overflow: 'hidden',
              }}>
              {VAKIT_TANIM.map((t, i) => {
                const aktif = t.key === siradaki;
                return (
                  <View
                    key={t.key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      borderBottomWidth: i < 5 ? 1 : 0,
                      borderBottomColor: colors.rule,
                      backgroundColor: aktif ? colors.greenWash : 'transparent',
                    }}>
                    <t.Ikon size={19} weight={aktif ? 'fill' : 'regular'} color={colors.green0} />
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: aktif ? fonts.serifBold : fonts.serifMedium,
                        fontSize: 16,
                        color: colors.ink0,
                      }}>
                      {t.ad}
                    </Text>
                    {aktif ? (
                      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.8, color: colors.green0 }}>
                        SIRADAKİ
                      </Text>
                    ) : null}
                    <Text style={{ fontFamily: fonts.display, fontSize: 17, color: colors.ink0 }}>
                      {prayer.times[t.key]}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 14,
              }}>
              <Compass size={14} color={colors.green0} weight="fill" />
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.ink2 }}>
                Kıble saati {prayer.qiblaTime} · Gündüz {prayer.dayLength} · Gece {prayer.nightLength}
              </Text>
            </View>
            {prayer.source.startsWith('mock') ? (
              <Text style={{ textAlign: 'center', fontFamily: fonts.sans, fontSize: 10.5, color: colors.ink3, marginTop: 6 }}>
                Vakitler geçici olarak yerel hesapla üretiliyor; Diyanet servisi bağlanacak.
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
