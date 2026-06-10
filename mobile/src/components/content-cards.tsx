import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/lib/theme';
import type { Leaf } from '@/lib/types';

/** Yaprağın arka yüzü: özlü söz, isimler, geçmişte bugün ve kategori kartları. */
export function ContentCards({ leaf }: { leaf: Leaf }) {
  return (
    <View>
      {/* Özlü söz */}
      <View style={[styles.card, styles.quoteCard]}>
        <Text style={styles.quoteText}>"{leaf.quote.text}"</Text>
        {leaf.quote.author ? <Text style={styles.quoteAuthor}>— {leaf.quote.author}</Text> : null}
      </View>

      {/* Günün isimleri */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👶 Yavrunuza İsim</Text>
        <View style={styles.nameRow}>
          <View style={styles.nameCol}>
            <Text style={styles.nameLabel}>Kız</Text>
            <Text style={styles.nameValue}>{leaf.names.girl?.name ?? '—'}</Text>
            {leaf.names.girl?.meaning ? (
              <Text style={styles.nameMeaning}>{leaf.names.girl.meaning}</Text>
            ) : null}
          </View>
          <View style={styles.nameDividerV} />
          <View style={styles.nameCol}>
            <Text style={styles.nameLabel}>Erkek</Text>
            <Text style={styles.nameValue}>{leaf.names.boy?.name ?? '—'}</Text>
            {leaf.names.boy?.meaning ? (
              <Text style={styles.nameMeaning}>{leaf.names.boy.meaning}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Geçmişte bugün */}
      {leaf.historyEvents.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📜 Geçmişte Bugün</Text>
          {leaf.historyEvents.map((ev) => (
            <View key={`${ev.year}-${ev.text.slice(0, 12)}`} style={styles.historyRow}>
              <Text style={styles.historyYear}>{ev.year}</Text>
              <Text style={styles.historyText}>{ev.text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Kategori kartları */}
      {leaf.contents.map((c) => (
        <View key={c.itemId || c.categorySlug} style={styles.card}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryName}>
              {c.icon} {c.categoryName.toLocaleUpperCase('tr')}
            </Text>
            <Text style={styles.categoryStats}>
              ❤️ {c.likes} 💬 {c.comments}
            </Text>
          </View>
          <Text style={styles.contentTitle}>{c.title}</Text>
          <Text style={styles.contentBody}>{c.body}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginTop: 10,
  },
  quoteCard: { backgroundColor: '#FBF4E4', borderColor: colors.gold },
  quoteText: {
    fontSize: 14.5,
    fontStyle: 'italic',
    color: colors.ink,
    lineHeight: 21,
    textAlign: 'center',
  },
  quoteAuthor: {
    fontSize: 13,
    color: colors.gold,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.red, marginBottom: 8 },
  nameRow: { flexDirection: 'row' },
  nameCol: { flex: 1, alignItems: 'center' },
  nameDividerV: { width: 1, backgroundColor: colors.line, marginHorizontal: 8 },
  nameLabel: { fontSize: 12, color: colors.inkSoft, fontWeight: '700' },
  nameValue: { fontSize: 18, color: colors.ink, fontWeight: '900', marginTop: 2 },
  nameMeaning: { fontSize: 12, color: colors.inkSoft, textAlign: 'center', marginTop: 2 },
  historyRow: { flexDirection: 'row', marginTop: 6 },
  historyYear: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.blue,
    width: 48,
  },
  historyText: { flex: 1, fontSize: 13.5, color: colors.ink, lineHeight: 19 },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: { fontSize: 12.5, fontWeight: '800', color: colors.red, letterSpacing: 0.5 },
  categoryStats: { fontSize: 11.5, color: colors.inkSoft },
  contentTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  contentBody: { fontSize: 13.5, color: colors.ink, lineHeight: 20 },
});
