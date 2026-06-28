import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../src/lib/theme';

// GH-56 — Hub "Công cụ kỹ thuật" cho Staff. Gate role qua (staff)/_layout.
type ToolRow = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  href: '/(staff)/tools/battery-types' | '/(staff)/tools/calibration';
};

const ROWS: ToolRow[] = [
  {
    icon: 'battery-charging-outline',
    title: 'Loại pin',
    desc: 'Tra cứu thông số các model pin',
    href: '/(staff)/tools/battery-types',
  },
  {
    icon: 'options-outline',
    title: 'Calibration cảm biến',
    desc: 'Hiệu chỉnh cảm biến thiết bị IoT tại hiện trường',
    href: '/(staff)/tools/calibration',
  },
];

export default function ToolsHubScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Công cụ kỹ thuật</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {ROWS.map((row) => (
          <Pressable
            key={row.href}
            style={[styles.card, Shadow]}
            onPress={() => router.push(row.href)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={row.icon} size={22} color={Colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{row.title}</Text>
              <Text style={styles.cardDesc}>{row.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMute} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  content: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: 16, marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(52,199,89,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardDesc: { fontSize: 13, color: Colors.textMute, marginTop: 2 },
});
