import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '@/src/lib/theme';
import { BackButton } from '@/src/shared/components/ScreenHeader';
import { EnergyBackdrop } from '@/src/features/batteries/components/EnergyBackdrop';

// GH-56 — "Technical Tools" hub for Staff. Role gating via (staff)/_layout.
type ToolRow = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  // ⚠️ Union này liệt kê TƯỜNG MINH từng route — thêm màn hình mới mà quên nới ở đây là
  // TypeScript đỏ ngay, không phải lỗi lúc chạy. Cố ý giữ tường minh để không ai thêm một
  // đường dẫn gõ sai chính tả rồi phát hiện lúc bấm vào.
  href:
    | '/(staff)/tools/battery-types'
    | '/(staff)/tools/calibration'
    | '/(staff)/tools/devices'        // IOT3-64
    | '/(staff)/kb'
    | '/(staff)/blog';
};

const ROWS: ToolRow[] = [
  {
    icon: 'battery-charging-outline',
    title: 'Battery Types',
    desc: 'Look up specs for battery models',
    href: '/(staff)/tools/battery-types',
  },
  // Ẩn tạm Sensor Calibration khỏi Technical Tools — không xoá, chờ yêu cầu bật lại.
  // {
  //   icon: 'options-outline',
  //   title: 'Sensor Calibration',
  //   desc: 'Calibrate IoT device sensors in the field',
  //   href: '/(staff)/tools/calibration',
  // },
  {
    icon: 'hardware-chip-outline',
    title: 'Devices',
    desc: 'Status, firmware and heartbeat of gateways in the field',
    href: '/(staff)/tools/devices',
  },
  {
    icon: 'book-outline',
    title: 'Guide',
    desc: 'Troubleshooting guides, reference while working on tickets',
    href: '/(staff)/kb',
  },
  {
    icon: 'newspaper-outline',
    title: 'News',
    desc: 'Published articles from the system',
    href: '/(staff)/blog',
  },
];

export default function ToolsHubScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <EnergyBackdrop />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <Text style={styles.topTitle}>Technical Tools</Text>
        <View style={styles.headerSpacer} />
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
  headerSpacer: { width: 44 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  content: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: 16, marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(52,199,89,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardDesc: { fontSize: 13, color: Colors.textMute, marginTop: 2 },
});
