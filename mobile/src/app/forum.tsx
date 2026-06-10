import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

/** Faz 3'te doldurulacak: konular, yaprak/blog yorum dizileri, yeni konu açma. */
export default function ForumScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forum</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.emoji}>💬</Text>
        <Text style={styles.title}>Çok yakında</Text>
        <Text style={styles.text}>
          Takvim yaprakları ve blog yazıları üzerine tartışmalar, yeni konular burada açılacak.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.red, paddingVertical: 12, alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '900' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 12 },
  text: { fontSize: 14, color: colors.inkSoft, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
