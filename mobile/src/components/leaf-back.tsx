/** Yaprağın arka yüzü — Günün Sohbeti, Geçmişte Bugün, Biraz da Felsefe,
 *  Yemek Kültürü + Günün Menüsü ve diğer kategori bölümleri. */
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  Brain,
  CookingPot,
  FlowerTulip,
  ForkKnife,
  Scroll as ScrollIcon,
} from 'phosphor-react-native';
import { Label, Ornament, SectionHead } from '@/components/bits';
import { Comments } from '@/components/comments';
import { ReactionBar } from '@/components/reaction-bar';
import { fonts, useTheme } from '@/lib/theme';
import type { Leaf, LeafContent } from '@/lib/types';

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLocaleLowerCase('tr');

function SohbetBlok({
  etiket,
  baslik,
  metin,
  icon,
  dropcap,
}: {
  etiket: string;
  baslik: string;
  metin: string;
  icon?: React.ReactNode;
  dropcap?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 18 }}>
      <SectionHead etiket={etiket} baslik={baslik} icon={icon} />
      <Text
        style={{
          fontFamily: fonts.serif,
          fontSize: 13.5,
          lineHeight: 21.5,
          color: colors.ink1,
          textAlign: 'justify',
        }}>
        {dropcap ? (
          <Text style={{ fontFamily: fonts.displayX, fontSize: 34, lineHeight: 36, color: colors.red0 }}>
            {metin.charAt(0)}
          </Text>
        ) : null}
        {dropcap ? metin.slice(1) : metin}
      </Text>
    </View>
  );
}

export function LeafBack({ leaf }: { leaf: Leaf }) {
  const { colors } = useTheme();
  const by = (slug: string): LeafContent | undefined =>
    leaf.contents.find((c) => c.categorySlug === slug);

  const sohbet = by('gunun-sohbeti');
  const felsefe = by('biraz-da-felsefe');
  const yemek = by('gastronomi');
  const menu = by('gunun-menusu');
  const consumed = new Set(['gunun-sohbeti', 'biraz-da-felsefe', 'gastronomi', 'gunun-menusu', 'ozel-gunler']);
  const digerleri = leaf.contents.filter((c) => !consumed.has(c.categorySlug));

  const tarih = `${leaf.day} ${titleCase(leaf.monthName)} ${leaf.year}`;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 64 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Label color={colors.ink2}>Arka Yüz</Label>
        <Text style={{ fontFamily: fonts.display, fontSize: 13, color: colors.ink0 }}>{tarih}</Text>
      </View>
      <Ornament style={{ marginTop: 8, marginBottom: 16 }} />

      {sohbet ? (
        <SohbetBlok
          etiket={leaf.weekdayName === 'Cuma' ? 'CUMA SOHBETİ' : 'GÜNÜN SOHBETİ'}
          baslik={sohbet.title}
          metin={sohbet.body}
          icon={<FlowerTulip size={12} color={colors.gold2} weight="fill" />}
          dropcap
        />
      ) : null}

      {leaf.historyEvents.length > 0 ? (
        <View style={{ marginBottom: 18 }}>
          <SectionHead
            etiket="GEÇMİŞTE BUGÜN"
            baslik="Bazı Yaşanmışlar"
            icon={<ScrollIcon size={12} color={colors.gold2} weight="fill" />}
          />
          <View style={{ gap: 10 }}>
            {leaf.historyEvents.map((o, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ fontFamily: fonts.displayX, fontSize: 15, color: colors.red0, width: 42 }}>
                  {o.year}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fonts.serif,
                    fontSize: 13,
                    lineHeight: 19.5,
                    color: colors.ink1,
                  }}>
                  {o.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {felsefe ? (
        <SohbetBlok
          etiket="BİRAZ DA FELSEFE"
          baslik={felsefe.title}
          metin={felsefe.body}
          icon={<Brain size={12} color={colors.gold2} weight="fill" />}
        />
      ) : null}

      {yemek ? (
        <View style={{ marginBottom: 18 }}>
          <SectionHead
            etiket="YEMEK KÜLTÜRÜ"
            baslik={yemek.title}
            icon={<ForkKnife size={12} color={colors.gold2} weight="fill" />}
          />
          <Text
            style={{
              fontFamily: fonts.serif,
              fontSize: 13.5,
              lineHeight: 21.5,
              color: colors.ink1,
              textAlign: 'justify',
              marginBottom: 10,
            }}>
            {yemek.body}
          </Text>
          {menu ? (
            <View
              style={{
                backgroundColor: colors.redWash,
                borderWidth: 1,
                borderColor: colors.ruleGold,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <CookingPot size={12} color={colors.red0} weight="fill" />
                <Label size={9} color={colors.red0}>
                  Günün Menüsü
                </Label>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {menu.body.split(',').map((m, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: colors.surfaceCard,
                      borderWidth: 1,
                      borderColor: colors.rule,
                      borderRadius: 999,
                      paddingHorizontal: 11,
                      paddingVertical: 4,
                    }}>
                    <Text style={{ fontFamily: fonts.serif, fontSize: 12.5, color: colors.ink1 }}>
                      {m.trim()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {digerleri.map((c) => (
        <SohbetBlok
          key={c.itemId}
          etiket={c.categoryName.toLocaleUpperCase('tr')}
          baslik={c.title}
          metin={c.body}
        />
      ))}

      <Ornament style={{ marginTop: 4, marginBottom: 10 }} />
      <Text
        style={{
          textAlign: 'center',
          fontFamily: fonts.sansSemi,
          fontSize: 10.5,
          color: colors.ink2,
          letterSpacing: 0.2,
        }}>
        {tarih} — {titleCase(leaf.weekdayName)} — {leaf.hijri.day} {leaf.hijri.monthName} {leaf.hijri.year} —{' '}
        {leaf.seasonal.day} {leaf.seasonal.label} Günleri
      </Text>

      {leaf.id > 0 ? (
        <>
          <View style={{ marginTop: 18 }}>
            <ReactionBar targetType="Leaf" targetId={leaf.id} shareMessage={`${tarih} — BTTakvim yaprağı`} />
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.rule, paddingTop: 16, marginTop: 16 }}>
            <Comments targetType="Leaf" targetId={leaf.id} />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
