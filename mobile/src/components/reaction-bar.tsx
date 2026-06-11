/** Tepki çubuğu (mobil): Beğen / Kaydet / Paylaş / Bildir. */
import { BookmarkSimple, Heart, ShareNetwork, WarningCircle } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchReactionStatus, toggleReaction } from '@/lib/api';
import { fonts, useTheme } from '@/lib/theme';
import { useDeviceKey } from '@/lib/use-device-key';
import type { ReactionKind, ReactionStatus, TargetType } from '@/lib/types';

function Btn({
  icon, label, active, activeColor, borderColor, textActive, textInactive, onPress,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeColor?: string;
  borderColor: string;
  textActive: string;
  textInactive: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.btn,
        { borderColor },
        active ? { backgroundColor: activeColor, borderColor: activeColor } : null,
      ]}>
      {icon}
      <Text style={[styles.btnText, { color: active ? textActive : textInactive }]}>{label}</Text>
    </TouchableOpacity>
  );
}

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

  return (
    <View style={styles.row}>
      <Btn
        onPress={() => toggle('Like')}
        active={s?.myLike}
        activeColor={colors.red0}
        borderColor={colors.ruleStrong}
        textActive={colors.textOnDark}
        textInactive={colors.ink2}
        icon={<Heart size={15} weight={s?.myLike ? 'fill' : 'regular'} color={s?.myLike ? colors.textOnDark : colors.ink2} />}
        label={s ? `Beğen · ${s.likes}` : 'Beğen'}
      />
      <Btn
        onPress={() => toggle('Save')}
        active={s?.mySave}
        activeColor={colors.blue0}
        borderColor={colors.ruleStrong}
        textActive={colors.textOnDark}
        textInactive={colors.ink2}
        icon={<BookmarkSimple size={15} weight={s?.mySave ? 'fill' : 'regular'} color={s?.mySave ? colors.textOnDark : colors.ink2} />}
        label={s?.mySave ? 'Kaydedildi' : 'Kaydet'}
      />
      <Btn
        onPress={share}
        borderColor={colors.ruleStrong}
        textActive={colors.textOnDark}
        textInactive={colors.ink2}
        icon={<ShareNetwork size={15} color={colors.ink2} />}
        label="Paylaş"
      />
      <Btn
        onPress={() => toggle('Report')}
        borderColor={colors.ruleStrong}
        textActive={colors.textOnDark}
        textInactive={colors.ink2}
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
