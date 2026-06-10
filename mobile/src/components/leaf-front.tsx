/** Yaprağın ön yüzü — tasarım: ui_kits/mobil/leaf.jsx LeafFront. */
import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Compass, MapPin, Moon, Mosque, Quotes } from 'phosphor-react-native';
import { Arch, Label, Ornament, PanelBox, Rosette, StatRow } from '@/components/bits';
import { DayNightDial } from '@/components/day-night-dial';
import { MiniMonth } from '@/components/mini-month';
import { isWaxing, moonSentence, MoonPhase } from '@/components/moon-phase';
import { nextVakit, VakitSerit } from '@/components/vakit-serit';
import { todayIso } from '@/lib/dates';
import { fonts, useTheme } from '@/lib/theme';
import type { CityRef, Leaf, PrayerTimes } from '@/lib/types';

const PHOTOS = [
  require('../../assets/photos/foto-ege-koy-w.jpg'),
  require('../../assets/photos/foto-tas-ev-w.jpg'),
  require('../../assets/photos/foto-ege-deniz-w.jpg'),
];

function photoFor(dateIso: string) {
  const n = dateIso.split('-').reduce((a, p) => a + Number(p), 0);
  return PHOTOS[n % PHOTOS.length];
}

function vurguText(leaf: Leaf): string {
  if (leaf.specialDay) return leaf.specialDay.toLocaleUpperCase('tr');
  if (leaf.weekdayName === 'Cuma') return 'HAYIRLI CUMALAR';
  return `YILIN ${leaf.dayOfYear}. GÜNÜ`;
}

export interface LocationProps {
  cities: CityRef[];
  citySlug: string | null;
  usingGps: boolean;
  onSelectCity: (slug: string) => void;
  onUseGps: () => void;
}

export function LeafFront({
  leaf,
  prayer,
  prayerLoading,
  location,
  onSelectDay,
}: {
  leaf: Leaf;
  prayer: PrayerTimes | null;
  prayerLoading: boolean;
  location: LocationProps;
  onSelectDay?: (d: number) => void;
}) {
  const { colors } = useTheme();
  const monthNo = Number(leaf.date.split('-')[1]);
  const siradaki = prayer ? nextVakit(prayer, todayIso()) : null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 64 }}>
      {/* Marka bandı */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              backgroundColor: colors.red0,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontFamily: fonts.displayX, fontSize: 14, color: colors.gold2 }}>BT</Text>
          </View>
          <View>
            <Text style={{ fontFamily: fonts.ottoman, fontSize: 19, color: colors.ink0, lineHeight: 22 }}>
              BTTakvim
            </Text>
            <Label size={8} color={colors.ink3}>
              Günlük Yaprak Takvimi
            </Label>
          </View>
        </View>
        <Rosette size={30} />
        <View
          style={{
            borderWidth: 2,
            borderColor: colors.blue0,
            borderRadius: 8,
            paddingHorizontal: 9,
            paddingVertical: 2,
          }}>
          <Text style={{ fontFamily: fonts.displayX, fontSize: 18, color: colors.blue0 }}>
            {leaf.year}
          </Text>
        </View>
      </View>

      <Ornament style={{ marginVertical: 12 }} />

      {/* Günün sözü */}
      <View
        style={{
          flexDirection: 'row',
          gap: 9,
          alignItems: 'flex-start',
          backgroundColor: colors.goldWash,
          borderWidth: 1,
          borderColor: colors.ruleGold,
          borderRadius: 8,
          paddingHorizontal: 11,
          paddingVertical: 9,
        }}>
        <Quotes size={16} color={colors.gold0} weight="fill" style={{ marginTop: 2 }} />
        <Text style={{ flex: 1, fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink1, lineHeight: 20 }}>
          {leaf.quote.text}
          {leaf.quote.author ? (
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.gold0, fontStyle: 'normal' }}>
              {'  — ' + leaf.quote.author}
            </Text>
          ) : null}
        </Text>
      </View>

      {/* HERO — mihrap kemeri nişinde ay adı + dev gün + gün adı */}
      <View style={{ marginTop: 18, paddingTop: 6 }}>
        <View style={{ position: 'absolute', left: '6%', right: '6%', top: 0, bottom: '14%', opacity: 0.6 }}>
          <Arch />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Rosette size={18} style={{ marginBottom: 6 }} />
          <Text style={{ fontFamily: fonts.ottoman, fontSize: 27, letterSpacing: 2.2, color: colors.ink0 }}>
            {leaf.monthName.toLocaleUpperCase('tr')}
          </Text>
          <Text style={{ fontFamily: fonts.sansSemi, fontSize: 12, color: colors.ink2, marginTop: 3 }}>
            {monthNo}. Ay · Yılın {leaf.dayOfYear}. Günü
          </Text>
          <Text
            style={{
              fontFamily: fonts.displayBlack,
              fontSize: 124,
              lineHeight: 118,
              color: colors.red0,
              letterSpacing: -2,
              marginTop: 4,
            }}>
            {leaf.day}
          </Text>
          <Text style={{ fontFamily: fonts.ottoman, fontSize: 28, letterSpacing: 1.7, color: colors.red0, marginTop: 4 }}>
            {leaf.weekdayName.toLocaleUpperCase('tr')}
          </Text>
          <View
            style={{
              marginTop: 10,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: colors.red0,
              maxWidth: '92%',
            }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 10.5,
                letterSpacing: 0.7,
                color: colors.textOnRed,
              }}>
              {vurguText(leaf)}
            </Text>
          </View>
        </View>
      </View>

      <Ornament style={{ marginVertical: 16 }} />

      {/* Ay durumu + Yavrunuza isim */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PanelBox style={{ flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <MoonPhase illum={leaf.moon.illumination} waxing={isWaxing(leaf.moon.key)} size={38} />
          <View style={{ flex: 1 }}>
            <Label size={8} color={colors.ink3}>
              Ayın Durumu
            </Label>
            <Text style={{ fontFamily: fonts.serif, fontSize: 12, color: colors.ink1, lineHeight: 16, marginTop: 2 }}>
              {moonSentence(leaf.moon.key, leaf.moon.name)}
            </Text>
          </View>
        </PanelBox>
        <PanelBox style={{ flex: 1 }}>
          <Label size={8} color={colors.ink3}>
            Yavrunuza İsim
          </Label>
          <View style={{ marginTop: 5, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fonts.serif, fontSize: 13, color: colors.ink2 }}>Kız</Text>
              <Text style={{ fontFamily: fonts.serifSemi, fontSize: 13, color: colors.red0 }}>
                {leaf.names.girl?.name ?? '—'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fonts.serif, fontSize: 13, color: colors.ink2 }}>Erkek</Text>
              <Text style={{ fontFamily: fonts.serifSemi, fontSize: 13, color: colors.blue1 }}>
                {leaf.names.boy?.name ?? '—'}
              </Text>
            </View>
          </View>
        </PanelBox>
      </View>

      {/* Mini ay takvimi + takvim verileri */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <PanelBox style={{ flex: 1 }}>
          <Label size={8} color={colors.ink3} style={{ textAlign: 'center', marginBottom: 6 }}>
            {leaf.monthName.toLocaleUpperCase('tr')} {leaf.year}
          </Label>
          <MiniMonth year={leaf.year} month={monthNo} day={leaf.day} onSelectDay={onSelectDay} />
        </PanelBox>
        <PanelBox style={{ flex: 1.05, paddingVertical: 4 }}>
          <StatRow label="Hicrî Yıl" value={leaf.hijri.year} />
          <StatRow label={leaf.hijri.monthName} value={leaf.hijri.day} />
          <StatRow label="Rûmî Yıl" value={leaf.rumi.year} />
          <StatRow label={leaf.rumi.monthName} value={leaf.rumi.day} />
          <StatRow label={`${leaf.seasonal.label} Günleri`} value={leaf.seasonal.day} />
          {leaf.coldPeriod ? (
            <StatRow label={leaf.coldPeriod.label} value={leaf.coldPeriod.day} last />
          ) : (
            <StatRow label="Kıble Saati" value={prayer?.qiblaTime ?? '—'} last />
          )}
        </PanelBox>
      </View>

      {/* Gece-gündüz kadranı + kıble */}
      <PanelBox style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <DayNightDial dayFraction={prayer?.dayFraction ?? 0.4} dayText={prayer?.dayLength ?? ''} size={92} />
        <View style={{ flex: 1, gap: 7 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Moon size={12} color={colors.ink2} weight="fill" />
              <Text style={{ fontFamily: fonts.sansSemi, fontSize: 11, color: colors.ink2 }}>Gece</Text>
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 13, color: colors.ink0 }}>
              {prayer?.nightLength ?? '—'}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.rule }} />
          <View>
            <Label size={8} color={colors.ink3}>
              {prayer && prayer.dayLengthDeltaSeconds < 0 ? 'Gecenin Uzaması' : 'Gündüzün Uzaması'}
            </Label>
            <Text style={{ fontFamily: fonts.serif, fontSize: 12, color: colors.ink1, marginTop: 1 }}>
              {prayer?.dayLengthDeltaText ?? '—'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Compass size={12} color={colors.green0} weight="fill" />
              <Text style={{ fontFamily: fonts.sansSemi, fontSize: 11, color: colors.ink2 }}>Kıble Saati</Text>
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 13, color: colors.ink0 }}>
              {prayer?.qiblaTime ?? '—'}
            </Text>
          </View>
        </View>
      </PanelBox>

      {/* Namaz vakitleri */}
      <View style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <Mosque size={12} color={colors.green0} weight="fill" />
          <Label color={colors.green0}>Namaz Vakitleri</Label>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
          <TouchableOpacity
            onPress={location.onUseGps}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: location.usingGps ? colors.green0 : colors.ruleStrong,
              backgroundColor: location.usingGps ? colors.green0 : 'transparent',
            }}>
            <MapPin
              size={12}
              weight={location.usingGps ? 'fill' : 'regular'}
              color={location.usingGps ? colors.textOnDark : colors.ink1}
            />
            <Text
              style={{
                fontFamily: fonts.sansSemi,
                fontSize: 12,
                color: location.usingGps ? colors.textOnDark : colors.ink1,
              }}>
              Konumum
            </Text>
          </TouchableOpacity>
          {location.cities.map((c) => {
            const aktif = !location.usingGps && c.slug === location.citySlug;
            return (
              <TouchableOpacity
                key={c.slug}
                onPress={() => location.onSelectCity(c.slug)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: aktif ? colors.green0 : colors.ruleStrong,
                  backgroundColor: aktif ? colors.green0 : 'transparent',
                }}>
                <Text
                  style={{
                    fontFamily: fonts.sansSemi,
                    fontSize: 12,
                    color: aktif ? colors.textOnDark : colors.ink1,
                  }}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {prayerLoading || !prayer ? (
          <ActivityIndicator color={colors.green0} style={{ marginVertical: 16 }} />
        ) : (
          <VakitSerit prayer={prayer} siradaki={siradaki} />
        )}
      </View>

      {/* Günün fotoğrafı */}
      <View style={{ marginTop: 16 }}>
        <Label color={colors.ink3} style={{ marginBottom: 7 }}>
          Günün Fotoğrafı
        </Label>
        <View
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.ruleStrong,
            backgroundColor: colors.paper2,
          }}>
          <Image source={photoFor(leaf.date)} style={{ width: '100%', height: 190 }} resizeMode="cover" />
        </View>
      </View>

      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Label size={9} color={colors.ink3}>
          Büyük Saatli · BTTakvim
        </Label>
      </View>
    </ScrollView>
  );
}
