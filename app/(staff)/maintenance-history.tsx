import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '@/src/lib/theme';
import { useMyMaintenanceLogs } from '@/src/features/staff/hooks/useMyMaintenanceLogs';
import { BackButton } from '@/src/shared/components/ScreenHeader';

// GH-44 #3 — lịch sử bảo trì cá nhân của Staff, gom nhóm theo ticket.
export default function MaintenanceHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { data: groups = [], isLoading, isError, refetch } = useMyMaintenanceLogs();

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <Text style={styles.topTitle}>Lịch sử bảo trì</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.textFaint} />
          <Text style={styles.emptyText}>Không tải được lịch sử.</Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, Shadow]}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="construct-outline" size={32} color={Colors.textFaint} />
          <Text style={styles.emptyText}>Chưa có nhật ký bảo trì nào.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {groups.map((group) => (
            <View key={group.ticketId} style={[styles.groupCard, Shadow]}>
              <Pressable
                style={styles.groupHeader}
                onPress={() =>
                  router.push({
                    pathname: '/(staff)/tickets/[id]',
                    params: { id: group.ticketId },
                  })
                }
              >
                <View style={styles.groupHeaderText}>
                  <Text style={styles.ticketCode}>{group.ticketCode}</Text>
                  <Text style={styles.ticketTitle} numberOfLines={1}>{group.ticketTitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textFaint} />
              </Pressable>

              {group.logs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  {!!log.summary && <Text style={styles.logSummary}>{log.summary}</Text>}
                  {log.durationMinutes > 0 && (
                    <Text style={styles.logMeta}>Thời gian: {log.durationMinutes} phút</Text>
                  )}
                  <Text style={styles.logTime}>
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  headerSpacer: { width: 44 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 24 },
  emptyText: { color: Colors.textMute, fontSize: 14 },
  retryBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12, backgroundColor: Colors.card },
  retryText: { color: Colors.primary, fontWeight: '700' },
  content: { padding: 16, gap: 12 },
  groupCard: { backgroundColor: Colors.card, borderRadius: 18, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupHeaderText: { flex: 1, gap: 2 },
  ticketCode: { fontSize: 11, fontWeight: '700', color: Colors.textMute, letterSpacing: 0.2 },
  ticketTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  logItem: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, gap: 3 },
  logSummary: { fontSize: 13, color: Colors.text },
  logMeta: { fontSize: 12, color: Colors.textMute },
  logTime: { fontSize: 11, color: Colors.textFaint },
});
