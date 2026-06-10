import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/lib/theme';
import type { CityRef } from '@/lib/types';

interface Props {
  visible: boolean;
  cities: CityRef[];
  selectedSlug: string | null;
  usingGps: boolean;
  onSelectCity: (slug: string) => void;
  onUseGps: () => void;
  onClose: () => void;
}

/** Namaz vakti konumu: GPS (bulunulan konum) ya da listeden şehir seçimi. */
export function CityPicker({
  visible,
  cities,
  selectedSlug,
  usingGps,
  onSelectCity,
  onUseGps,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Konum Seç</Text>

          <TouchableOpacity
            style={[styles.row, usingGps && styles.rowActive]}
            onPress={onUseGps}>
            <Text style={[styles.rowText, usingGps && styles.rowTextActive]}>
              📡 Bulunduğum konumu kullan (GPS)
            </Text>
          </TouchableOpacity>

          <FlatList
            data={cities}
            keyExtractor={(c) => c.slug}
            style={{ maxHeight: 380 }}
            renderItem={({ item }) => {
              const active = !usingGps && item.slug === selectedSlug;
              return (
                <TouchableOpacity
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => onSelectCity(item.slug)}>
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>
                    📍 {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    paddingBottom: 28,
  },
  title: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  row: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: colors.paperShade,
  },
  rowActive: { backgroundColor: colors.red },
  rowText: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  rowTextActive: { color: colors.white },
  closeButton: { alignSelf: 'center', marginTop: 10, padding: 8 },
  closeText: { color: colors.inkSoft, fontWeight: '700', fontSize: 15 },
});
