import React, { useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Shadow } from '../../../src/lib/theme';
import { AlertItem, useAlertsStore } from '../../../src/stores/alertsStore';
import { useMyBatteryAssets } from '../../../src/features/batteries/hooks/useMyBatteryAssets';
import { BatteryAssetDto } from '../../../src/features/batteries/types/battery.types';

type FilterType = 'all' | 'Critical' | 'Warning' | 'Info' | 'unread';

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { alerts, markAllAsRead, markAsRead } = useAlertsStore();
  const { data: batteries = [] } = useMyBatteryAssets();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const unreadCount = alerts.filter((a) => !a.read).length;
  const totalCount = alerts.length;

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !alert.read;
    return alert.type === activeFilter;
  });

  const getAlertColors = (type: string, read: boolean) => {
    switch (type) {
      case 'Critical':
        return {
          bg: '#FFEBEA',
          iconColor: '#DC4F3D',
          badgeBg: '#FFE5E3',
          badgeText: '#B73221',
          valueColor: '#B73221',
        };
      case 'Warning':
        return {
          bg: '#FFF3E3',
          iconColor: '#FFB703',
          badgeBg: '#FFF1B8',
          badgeText: '#9C7800',
          valueColor: '#9C7800',
        };
      case 'Info':
      default:
        return {
          bg: '#EBF3FF',
          iconColor: '#5081C7',
          badgeBg: '#DCE6F5',
          badgeText: '#2A538A',
          valueColor: '#2A538A',
        };
    }
  };

  const renderAlertItem = ({ item }: { item: AlertItem }) => {
    const colors = getAlertColors(item.type, item.read);
    const battery = batteries.find((b: BatteryAssetDto) => b.id === item.batteryId);

    const handlePress = () => {
      markAsRead(item.id);
      router.push({
        pathname: '/(customer)/alerts/[id]',
        params: { id: item.id },
      });
    };

    return (
      <Pressable style={[styles.card, Shadow]} onPress={handlePress}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
            <Ionicons
              name={item.type === 'Critical' || item.type === 'Warning' ? 'alert-circle-outline' : 'information-circle-outline'}
              size={20}
              color={colors.iconColor}
            />
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.tagRow}>
              <View style={[styles.typeBadge, { backgroundColor: colors.badgeBg }]}>
                <View style={[styles.badgeDot, { backgroundColor: colors.badgeText }]} />
                <Text style={[styles.typeBadgeText, { color: colors.badgeText }]}>
                  {item.type.toUpperCase()}
                </Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.alertTitle}>{item.title}</Text>
            <Text style={styles.alertMeta}>
              {battery?.serialNumber ?? 'Battery'} · {item.time}
            </Text>
          </View>
          <View style={styles.valueWrap}>
            <Text style={[styles.valText, { color: colors.valueColor }]}>
              {item.actual}
            </Text>
            <Text style={styles.thrText}>
              thr {item.threshold}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Cảnh báo</Text>
          <Text style={styles.subtitle}>
            {unreadCount} chưa đọc · {totalCount} tổng
          </Text>
        </View>
        <Pressable style={[styles.readAllBtn, Shadow]} onPress={markAllAsRead}>
          <Ionicons name="checkmark-done" size={14} color={Colors.text} style={{ marginRight: 4 }} />
          <Text style={styles.readAllText}>Đã đọc</Text>
        </Pressable>
      </View>

      {/* Filter Horizontal Row */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {(
            [
              { key: 'all', label: 'Tất cả' },
              { key: 'Critical', label: 'Critical' },
              { key: 'Warning', label: 'Warning' },
              { key: 'Info', label: 'Info' },
              { key: 'unread', label: 'Chưa đọc' },
            ] as const
          ).map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.filterTab,
                activeFilter === f.key && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.textFaint} />
            <Text style={styles.emptyText}>Không có cảnh báo nào</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMute,
    marginTop: 2,
  },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },
  readAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  filterContainer: {
    marginBottom: 14,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },
  filterTabActive: {
    backgroundColor: '#34C759',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMute,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  alertMeta: {
    fontSize: 11,
    color: Colors.textMute,
    marginTop: 3,
  },
  valueWrap: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  valText: {
    fontSize: 14,
    fontWeight: '800',
  },
  thrText: {
    fontSize: 10,
    color: Colors.textMute,
    marginTop: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMute,
  },
});
