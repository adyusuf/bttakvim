/** Çevrilebilir yaprak — 3B rotateY + altın köşebent çerçeve (Tweaks: çerçeve/kubbe/madalyon). */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowClockwise, ArrowCounterClockwise } from 'phosphor-react-native';
import { fonts, useTheme } from '@/lib/theme';

const FLIP_MS = 620;
const EASE = Easing.bezier(0.22, 0.61, 0.36, 1);

function FrameOverlay() {
  const { colors, prefs } = useTheme();
  if (prefs.frame === 'sade') return null;

  const domeTop = prefs.dome ? 42 : undefined;
  if (prefs.frame === 'cizgi') {
    return (
      <View
        pointerEvents="none"
        style={[
          styles.frame,
          {
            borderColor: colors.ruleStrong,
            borderWidth: 1,
            borderTopLeftRadius: domeTop ?? 11,
            borderTopRightRadius: domeTop ?? 11,
          },
        ]}
      />
    );
  }

  // Altın çift cetvel + köşe medalyon noktaları
  const dot = (pos: object) => (
    <View
      key={JSON.stringify(pos)}
      style={[{ position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold0 }, pos]}
    />
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.frame,
          {
            borderColor: colors.gold0,
            borderWidth: 1.5,
            borderTopLeftRadius: domeTop ?? 12,
            borderTopRightRadius: domeTop ?? 12,
          },
        ]}
      />
      <View
        style={[
          styles.frameInner,
          {
            borderColor: colors.gold2,
            borderWidth: 1,
            borderTopLeftRadius: domeTop ? domeTop - 4 : 9,
            borderTopRightRadius: domeTop ? domeTop - 4 : 9,
          },
        ]}
      />
      {dot({ top: 9, left: 9 })}
      {dot({ top: 9, right: 9 })}
      {dot({ bottom: 9, left: 9 })}
      {dot({ bottom: 9, right: 9 })}
      {prefs.medallion ? (
        <>
          {[
            { top: 12, left: 12 },
            { top: 12, right: 12 },
            { bottom: 12, left: 12 },
            { bottom: 12, right: 12 },
          ].map((pos, i) => (
            <View
              key={i}
              style={[
                { position: 'absolute', width: 11, height: 11, borderRadius: 6, borderWidth: 1, borderColor: colors.gold0, alignItems: 'center', justifyContent: 'center' },
                pos,
              ]}>
              <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.gold0 }} />
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

function FlipTab({
  label,
  left,
  onPress,
}: {
  label: string;
  left?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const Ikon = left ? ArrowCounterClockwise : ArrowClockwise;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        position: 'absolute',
        bottom: 14,
        [left ? 'left' : 'right']: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.surfaceInk,
        shadowColor: '#211A12',
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}>
      {left ? <Ikon size={14} color={colors.gold2} /> : null}
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 0.5, color: colors.textOnDark }}>
        {label}
      </Text>
      {!left ? <Ikon size={14} color={colors.gold2} /> : null}
    </TouchableOpacity>
  );
}

export function LeafCard({
  flipped,
  onFlip,
  front,
  back,
}: {
  flipped: boolean;
  onFlip: () => void;
  front: React.ReactNode;
  back: React.ReactNode;
}) {
  const { colors, prefs } = useTheme();
  const anim = useRef(new Animated.Value(flipped ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: flipped ? 1 : 0,
      duration: FLIP_MS,
      easing: EASE,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [flipped, anim]);

  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = anim.interpolate({
    inputRange: [0, 0.5, 0.500001, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = anim.interpolate({
    inputRange: [0, 0.499999, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  const domeTop = prefs.dome ? 48 : 16;
  const faceStyle = {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.rule,
    borderTopLeftRadius: domeTop,
    borderTopRightRadius: domeTop,
    paddingTop: prefs.dome ? 12 : 0,
  };

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        pointerEvents={flipped ? 'none' : 'auto'}
        style={[
          styles.face,
          faceStyle,
          {
            opacity: frontOpacity,
            transform: [{ perspective: 2000 }, { rotateY: frontRotate }],
          },
        ]}>
        {front}
        <FrameOverlay />
        <FlipTab label="Arka yüz" onPress={onFlip} />
      </Animated.View>
      <Animated.View
        pointerEvents={flipped ? 'auto' : 'none'}
        style={[
          styles.face,
          faceStyle,
          {
            opacity: backOpacity,
            transform: [{ perspective: 2000 }, { rotateY: backRotate }],
          },
        ]}>
        {back}
        <FrameOverlay />
        <FlipTab label="Ön yüz" left onPress={onFlip} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    shadowColor: '#211A12',
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  frame: { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderRadius: 12 },
  frameInner: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderRadius: 9 },
});
