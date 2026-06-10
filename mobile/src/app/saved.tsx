import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

/** Faz 2'de doldurulacak: kaydedilen yapraklar ve içerikler. */
export default function SavedScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kaydedilenler</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.emoji}>🔖</Text>
        <Text style={styles.title}>Henüz kayıt yok</Text>
        <Text style={styles.text}>
          Beğendiğiniz yaprakları ve içerikleri kaydettiğinizde burada listelenecek.
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
