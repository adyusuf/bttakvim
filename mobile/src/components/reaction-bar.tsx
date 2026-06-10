/** Tepki çubuğu (mobil): Beğen / Kaydet / Paylaş / Bildir. */
import { BookmarkSimple, Heart, ShareNetwork, WarningCircle } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchReactionStatus, toggleReaction } from '@/lib/api';
import { fonts, useTheme } from '@/lib/theme';
import { useDeviceKey } from '@/lib/use-device-key';
import type { ReactionKind, ReactionStatus, TargetType } from '@/lib/types';

export function ReactionBar({
  targetType,
  targetId,
  shareMessage,
}: {
  targetType: TargetType;
  targetId: number;
  shareMessage: string;
}) {
  const { colors } = useTheme();
  const dev = useDeviceKey();
  const [s, setS] = useState<ReactionStatus | null>(null);

  useEffect(() => {
    if (dev && targetId > 0) fetchReactionStatus(targetType, targetId, dev).then(setS).catch(() => {});
  }, [dev, targetType, targetId]);

  const toggle = async (kind: ReactionKind) => {
    if (!dev || targetId <= 0) return;
    if (kind === 'Report') {
      Alert.alert('İçeriği bildir', 'Bu içeriği uygunsuz olarak bildirmek istiyor musunuz?', [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Bildir',
          style: 'destructive',
          onPress: async () => {
            await toggleReaction(targetType, targetId, 'Report', dev);
            setS(await fetchReactionStatus(targetType, targetId, dev));
          },
        },
      ]);
      return;
    }
    await toggleReaction(targetType, targetId, kind, dev);
    setS(await fetchReactionStatus(targetType, targetId, dev));
  };

  const share = () => Share.share({ message: shareMessage });

  const Btn = ({
    kind, icon, label, active, activeColor,
  }: {
    kind?: ReactionKind; icon: React.ReactNode; label: string; active?: boolean; activeColor?: string;
  }) => (
    <TouchableOpacity
      onPress={kind ? () => toggle(kind) : share}
      style={[
        styles.btn,
        { borderColor: colors.ruleStrong },
        active ? { backgroundColor: activeColor, borderColor: activeColor } : null,
      ]}>
      {icon}
      <Text style={[styles.btnText, { color: active ? colors.textOnDark : colors.ink2 }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.row}>
      <Btn
        kind="Like"
        active={s?.myLike}
        activeColor={colors.red0}
        icon={<Heart size={15} weight={s?.myLike ? 'fill' : 'regular'} color={s?.myLike ? colors.textOnDark : colors.ink2} />}
        label={s ? `Beğen · ${s.likes}` : 'Beğen'}
      />
      <Btn
        kind="Save"
        active={s?.mySave}
        activeColor={colors.blue0}
        icon={<BookmarkSimple size={15} weight={s?.mySave ? 'fill' : 'regular'} color={s?.mySave ? colors.textOnDark : colors.ink2} />}
        label={s?.mySave ? 'Kaydedildi' : 'Kaydet'}
      />
      <Btn icon={<ShareNetwork size={15} color={colors.ink2} />} label="Paylaş" />
      <Btn
        kind="Report"
        icon={<WarningCircle size={15} color={colors.ink2} />}
        label={s && s.reports > 0 ? `Bildir · ${s.reports}` : 'Bildir'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  btnText: { fontFamily: fonts.sansSemi, fontSize: 12.5 },
});
