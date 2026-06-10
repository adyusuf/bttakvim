/** Daha — ayarlar: şehir, tema (palet), Osmanlı dokunuşları, hakkında. */
import {
  Archive,
  Bell,
  BookmarkSimple,
  CaretRight,
  CircleHalf,
  Crown,
  Info,
  MapPin,
  Note,
  Palette as PaletteIcon,
  TextAa,
} from 'phosphor-react-native';
import React, { useState } from 'react';
import { Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Label, Ornament } from '@/components/bits';
import { useAppState } from '@/lib/app-state';
import { fonts, PALETTES, useTheme } from '@/lib/theme';

function Row({
  icon,
  label,
  value,
  onPress,
  last,
  control,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
  control?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingHorizontal: 15,
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.rule,
      }}>
      {icon}
      <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink0 }}>{label}</Text>
      {value ? (
        <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink2 }}>{value}</Text>
      ) : null}
      {control ?? (onPress ? <CaretRight size={15} color={colors.ink3} /> : null)}
    </TouchableOpacity>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 18 }}>
      <Label size={10} color={colors.ink3} style={{ marginBottom: 8, marginLeft: 4 }}>
        {title}
      </Label>
      <View
        style={{
          backgroundColor: colors.surfaceCard,
          borderWidth: 1,
          borderColor: colors.rule,
          borderRadius: 16,
          overflow: 'hidden',
        }}>
        {children}
      </View>
    </View>
  );
}

function PaletteModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, prefs, setPrefs } = useTheme();
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
            maxHeight: '75%',
          }}>
          <Text style={{ fontFamily: fonts.ottoman, fontSize: 20, color: colors.ink0, marginBottom: 2 }}>
            Renk Paleti
          </Text>
          <Ornament style={{ marginVertical: 10 }} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {PALETTES.map((p) => {
              const aktif = p.id === prefs.paletteId;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    setPrefs({ paletteId: p.id });
                    onClose();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: aktif ? colors.gold0 : colors.rule,
                    backgroundColor: aktif ? colors.goldWash : colors.surfaceCard,
                  }}>
                  <View style={{ flexDirection: 'row', gap: 3 }}>
                    {p.swatch.map((s) => (
                      <View key={s} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: s }} />
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink0 }}>{p.name}</Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, color: colors.ink2 }}>{p.note}</Text>
                  </View>
                  {aktif ? <Crown size={16} color={colors.gold0} weight="fill" /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={{ alignSelf: 'center', padding: 8, marginTop: 6 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink2 }}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function DahaScreen() {
  const { colors, palette, prefs, setPrefs } = useTheme();
  const { cityName } = useAppState();
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceApp }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }}>
        <Text style={{ fontFamily: fonts.displayX, fontSize: 28, color: colors.ink0, marginTop: 4, marginBottom: 16 }}>
          Daha
        </Text>

        <Group title="Takvim">
          <Row icon={<MapPin size={19} color={colors.ink1} />} label="Şehir" value={cityName} />
          <Row icon={<Bell size={19} color={colors.ink1} />} label="Vakit hatırlatmaları" value="Yakında" />
          <Row icon={<Note size={19} color={colors.ink1} />} label="Yaprak açılışı" value="Ön yüz" last />
        </Group>

        <Group title="Görünüm">
          <Row
            icon={<PaletteIcon size={19} color={colors.ink1} />}
            label="Tema"
            value={palette.name}
            onPress={() => setPaletteOpen(true)}
          />
          <Row
            icon={<CircleHalf size={19} color={colors.ink1} />}
            label="Kubbeli üst"
            control={
              <Switch
                value={prefs.dome}
                onValueChange={(v) => setPrefs({ dome: v })}
                trackColor={{ true: colors.gold1, false: colors.paper3 }}
                thumbColor={colors.surfaceCard}
              />
            }
          />
          <Row
            icon={<Crown size={19} color={colors.ink1} />}
            label="Köşe madalyonu"
            control={
              <Switch
                value={prefs.medallion}
                onValueChange={(v) => setPrefs({ medallion: v })}
                trackColor={{ true: colors.gold1, false: colors.paper3 }}
                thumbColor={colors.surfaceCard}
              />
            }
          />
          <Row icon={<TextAa size={19} color={colors.ink1} />} label="Yazı boyutu" value="Orta" last />
        </Group>

        <Group title="İçerik">
          <Row icon={<BookmarkSimple size={19} color={colors.ink1} />} label="Kaydedilenler" value="Yakında" />
          <Row icon={<Archive size={19} color={colors.ink1} />} label="Geçmiş yapraklar" />
          <Row icon={<Info size={19} color={colors.ink1} />} label="BTTakvim hakkında" last />
        </Group>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Label size={9} color={colors.ink3}>
            BTTakvim · Sürüm 1.0
          </Label>
        </View>
      </ScrollView>
      <PaletteModal visible={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </SafeAreaView>
  );
}
