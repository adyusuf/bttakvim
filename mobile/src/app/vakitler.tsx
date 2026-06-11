/** Vakitler — şehir cipsleri, sıradaki vakit kartı ve tam liste. */
import { ArrowCounterClockwise, Compass, Faders, Minus, Plus } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Label, Ornament } from '@/components/bits';
import { nextVakit, VAKIT_TANIM } from '@/components/vakit-serit';
import {
  DEFAULT_PRAYER_PREFS,
  fetchPrayerTimes,
  getPrayerPrefs,
  savePrayerPrefs,
  type PrayerPrefs,
  type PrayerTune,
} from '@/lib/api';
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

// Hesaplama yöntemi seçenekleri (Aladhan id → Türkçe etiket). Varsayılan 13.
const METHOD_OPTIONS: { id: number; label: string }[] = [
  { id: 13, label: 'Diyanet İşleri Başkanlığı (Türkiye)' },
  { id: 3, label: 'İslam Dünyası Birliği (MWL)' },
  { id: 2, label: 'ISNA (Kuzey Amerika)' },
  { id: 4, label: "Ümmü'l-Kura (Mekke)" },
  { id: 5, label: 'Mısır Genel Otoritesi' },
  { id: 1, label: 'Karaçi Üniversitesi' },
];

// Temkin ince ayarının uygulandığı vakit anahtarları (sıra: imsak…yatsı).
const TUNE_KEYS: { key: keyof PrayerTune; ad: string }[] = [
  { key: 'imsak', ad: 'İmsak' },
  { key: 'gunes', ad: 'Güneş' },
  { key: 'ogle', ad: 'Öğle' },
  { key: 'ikindi', ad: 'İkindi' },
  { key: 'aksam', ad: 'Akşam' },
  { key: 'yatsi', ad: 'Yatsı' },
];

const TUNE_MIN = -30;
const TUNE_MAX = 30;

function clampTune(v: number): number {
  return Math.max(TUNE_MIN, Math.min(TUNE_MAX, v));
}

function Stepper({
  ad,
  value,
  onChange,
}: {
  ad: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const { colors } = useTheme();
  const btn = (icon: React.ReactNode, onPress: () => void, disabled: boolean) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.ruleStrong,
        backgroundColor: colors.surfaceCard,
        opacity: disabled ? 0.4 : 1,
      }}>
      {icon}
    </TouchableOpacity>
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
      }}>
      <Text style={{ fontFamily: fonts.serifMedium, fontSize: 15, color: colors.ink0 }}>{ad}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {btn(<Minus size={16} color={colors.ink1} weight="bold" />, () => onChange(clampTune(value - 1)), value <= TUNE_MIN)}
        <Text
          style={{
            minWidth: 44,
            textAlign: 'center',
            fontFamily: fonts.display,
            fontSize: 16,
            color: value === 0 ? colors.ink2 : colors.green0,
          }}>
          {value > 0 ? `+${value}` : value} dk
        </Text>
        {btn(<Plus size={16} color={colors.ink1} weight="bold" />, () => onChange(clampTune(value + 1)), value >= TUNE_MAX)}
      </View>
    </View>
  );
}

function CalcSettingsModal({
  visible,
  prefs,
  onChange,
  onReset,
  onClose,
}: {
  visible: boolean;
  prefs: PrayerPrefs;
  onChange: (next: PrayerPrefs) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(33,28,18,0.45)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.surfaceApp,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 16,
            paddingBottom: 32,
            maxHeight: '85%',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.ottoman, fontSize: 20, color: colors.ink0 }}>
              Hesaplama Ayarları
            </Text>
            <TouchableOpacity
              onPress={onReset}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4 }}>
              <ArrowCounterClockwise size={15} color={colors.ink2} />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink2 }}>Sıfırla</Text>
            </TouchableOpacity>
          </View>
          <Ornament style={{ marginVertical: 10 }} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hesaplama yöntemi */}
            <Label size={10} color={colors.ink3} style={{ marginBottom: 8, marginLeft: 2 }}>
              Hesaplama Yöntemi
            </Label>
            <View
              style={{
                backgroundColor: colors.surfaceCard,
                borderWidth: 1,
                borderColor: colors.rule,
                borderRadius: 14,
                overflow: 'hidden',
                marginBottom: 18,
              }}>
              {METHOD_OPTIONS.map((m, i) => {
                const aktif = m.id === prefs.method;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => onChange({ ...prefs, method: m.id })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderBottomWidth: i < METHOD_OPTIONS.length - 1 ? 1 : 0,
                      borderBottomColor: colors.rule,
                      backgroundColor: aktif ? colors.greenWash : 'transparent',
                    }}>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 2,
                        borderColor: aktif ? colors.green0 : colors.ruleStrong,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      {aktif ? (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green0 }} />
                      ) : null}
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: aktif ? fonts.serifBold : fonts.serifMedium,
                        fontSize: 14.5,
                        color: colors.ink0,
                      }}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Asr (mezhep) */}
            <Label size={10} color={colors.ink3} style={{ marginBottom: 8, marginLeft: 2 }}>
              İkindi (Asr) Hesabı
            </Label>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              {([0, 1] as const).map((s) => {
                const aktif = prefs.school === s;
                const ad = s === 0 ? 'Şâfiî / Mâlikî / Hanbelî (standart)' : 'Hanefî';
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => onChange({ ...prefs, school: s })}
                    style={{
                      flex: 1,
                      paddingVertical: 11,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: aktif ? colors.green0 : colors.ruleStrong,
                      backgroundColor: aktif ? colors.green0 : colors.surfaceCard,
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        fontFamily: fonts.sansSemi,
                        fontSize: 12.5,
                        textAlign: 'center',
                        color: aktif ? colors.textOnDark : colors.ink1,
                      }}>
                      {ad}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Temkin ince ayarı */}
            <Label size={10} color={colors.ink3} style={{ marginBottom: 2, marginLeft: 2 }}>
              İnce Ayar (Temkin)
            </Label>
            <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, color: colors.ink2, marginBottom: 8, marginLeft: 2 }}>
              Her vakti dakika cinsinden öne (−) veya geriye (+) alın.
            </Text>
            <View
              style={{
                backgroundColor: colors.surfaceCard,
                borderWidth: 1,
                borderColor: colors.rule,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 4,
                marginBottom: 10,
              }}>
              {TUNE_KEYS.map(({ key, ad }) => (
                <Stepper
                  key={key}
                  ad={ad}
                  value={prefs.tune[key]}
                  onChange={(next) => onChange({ ...prefs, tune: { ...prefs.tune, [key]: next } })}
                />
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={{ alignSelf: 'center', padding: 8, marginTop: 6 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink2 }}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function VakitlerScreen() {
  const { colors } = useTheme();
  const { cities, location, selectCity, useGps, cityName } = useAppState();

  // Hesaplama tercihleri: AsyncStorage'dan yüklenir, her değişiklikte kaydedilir.
  // null iken (ilk yükleme) varsayılan kullanılır; böylece ilk fetch beklemez.
  const [prefs, setPrefs] = useState<PrayerPrefs | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const effectivePrefs = prefs ?? DEFAULT_PRAYER_PREFS;

  useEffect(() => {
    let alive = true;
    getPrayerPrefs().then((p) => {
      if (alive) setPrefs(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Vakitler, hangi konum + tercih için yüklendiği bilgisiyle birlikte tutulur;
  // herhangi biri değişince eski veri (key uyuşmazlığı) otomatik null'a düşer ve spinner görünür.
  const prefsKey = `${effectivePrefs.method}|${effectivePrefs.school}|${TUNE_KEYS.map((t) => effectivePrefs.tune[t.key]).join(',')}`;
  const locationKey =
    location.kind === 'city' ? `city:${location.slug}` : `gps:${location.lat},${location.lng}`;
  const fetchKey = `${locationKey}#${prefsKey}`;
  const [prayerState, setPrayerState] = useState<{ key: string; prayer: PrayerTimes } | null>(null);
  const prayer = prayerState?.key === fetchKey ? prayerState.prayer : null;

  useEffect(() => {
    let alive = true;
    fetchPrayerTimes(
      todayIso(),
      location.kind === 'city' ? { citySlug: location.slug } : { lat: location.lat, lng: location.lng },
      effectivePrefs,
    ).then((r) => {
      if (!alive) return;
      setPrayerState({ key: fetchKey, prayer: r });
    });
    return () => {
      alive = false;
    };
  }, [location, effectivePrefs, fetchKey]);

  const updatePrefs = (next: PrayerPrefs) => {
    setPrefs(next);
    savePrayerPrefs(next);
  };

  const resetPrefs = () => {
    const fresh: PrayerPrefs = { ...DEFAULT_PRAYER_PREFS, tune: { ...DEFAULT_PRAYER_PREFS.tune } };
    updatePrefs(fresh);
  };

  const siradaki = prayer ? nextVakit(prayer, todayIso()) : null;
  const siradakiTanim = VAKIT_TANIM.find((v) => v.key === siradaki);
  const tarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceApp }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.displayX, fontSize: 28, color: colors.ink0, marginTop: 4 }}>
              Namaz Vakitleri
            </Text>
            <Text style={{ fontFamily: fonts.serifItalic, fontSize: 13.5, color: colors.ink2, marginBottom: 14, marginTop: 2 }}>
              {tarih} · {prayer?.cityName ?? cityName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSettingsOpen(true)}
            accessibilityLabel="Hesaplama ayarları"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              marginTop: 4,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.ruleStrong,
              backgroundColor: colors.surfaceCard,
            }}>
            <Faders size={20} color={colors.green0} />
          </TouchableOpacity>
        </View>

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
                Vakitler şu an yerel astronomik hesapla üretiliyor (Aladhan servisine ulaşılamadı); bağlantı sağlanınca güncel değerler gösterilir.
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>

      <CalcSettingsModal
        visible={settingsOpen}
        prefs={effectivePrefs}
        onChange={updatePrefs}
        onReset={resetPrefs}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}
