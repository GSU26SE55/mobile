import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../../../src/lib/theme';
import { useAlertsStore } from '../../../src/stores/alertsStore';
import { useMyBatteryAssets } from '../../../src/features/batteries/hooks/useMyBatteryAssets';
import { BatteryAssetDto } from '../../../src/features/batteries/types/battery.types';
import { useTickets } from '../../../src/features/tickets/hooks/useTickets';

export default function AlertDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alerts, acknowledge } = useAlertsStore();
  const { data: batteries = [] } = useMyBatteryAssets();

  const alertItem = alerts.find((a) => a.id === id);

  // Search for the ticket by code
  const { data: ticketsData, isLoading: ticketsLoading } = useTickets({ PageSize: 100 });

  if (!alertItem) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={32} color={Colors.textFaint} />
        <Text style={styles.errorText}>Không tìm thấy cảnh báo</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtnText}>
          <Text style={{ color: Colors.primary, fontWeight: '600' }}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const battery = batteries.find((b: BatteryAssetDto) => b.id === alertItem.batteryId);

  // Match alertItem.ticketCode with ticket in cache
  const linkedTicket = ticketsData?.items?.find((t) => t.code === alertItem.ticketCode);

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'Critical':
        return {
          iconColor: '#DC4F3D',
          iconBg: '#FFEBEA',
          badgeBg: '#FFE5E3',
          badgeText: '#B73221',
          valueColor: '#DC4F3D',
        };
      case 'Warning':
        return {
          iconColor: '#FFB703',
          iconBg: '#FFF3E3',
          badgeBg: '#FFF1B8',
          badgeText: '#9C7800',
          valueColor: '#FFB703',
        };
      case 'Info':
      default:
        return {
          iconColor: '#5081C7',
          iconBg: '#EBF3FF',
          badgeBg: '#DCE6F5',
          badgeText: '#2A538A',
          valueColor: '#5081C7',
        };
    }
  };

  const alertStyle = getAlertStyle(alertItem.type);

  const handleAcknowledge = () => {
    acknowledge(alertItem.id);
    Alert.alert('Thành công', 'Đã xác nhận cảnh báo này.');
    router.back();
  };

  const handleNavigateToBattery = () => {
    const navId = battery?.id ?? alertItem.batteryId;
    if (navId) {
      router.push({
        pathname: '/(customer)/batteries/[id]',
        params: { id: navId },
      });
    }
  };

  const handleNavigateToTicket = () => {
    if (linkedTicket) {
      router.push({
        pathname: '/(customer)/tickets/[id]',
        params: { id: linkedTicket.id },
      });
    } else if (alertItem.ticketCode) {
      Alert.alert('Thông tin', `Ticket ${alertItem.ticketCode} được tạo tự động bởi hệ thống.`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Seamless Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{alertItem.id}</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.content}>
        {/* Main Alert Card */}
        <View style={[styles.mainCard, Shadow]}>
          <View style={[styles.largeIconWrap, { backgroundColor: alertStyle.iconBg }]}>
            <Ionicons
              name={alertItem.type === 'Info' ? 'information-circle-outline' : 'alert-circle-outline'}
              size={34}
              color={alertStyle.iconColor}
            />
          </View>

          <View style={[styles.typeBadge, { backgroundColor: alertStyle.badgeBg }]}>
            <Text style={[styles.typeBadgeText, { color: alertStyle.badgeText }]}>
              {alertItem.type.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.titleText}>{alertItem.title}</Text>
          <Text style={styles.timeText}>{alertItem.time} · Hôm nay</Text>

          {/* Ngưỡng vs Thực tế values box */}
          <View style={styles.compBox}>
            <View style={styles.compItem}>
              <Text style={styles.compLabel}>NGƯỠNG</Text>
              <Text style={styles.compVal}>{alertItem.threshold}</Text>
            </View>
            <Ionicons name="arrow-forward-outline" size={16} color={Colors.textFaint} />
            <View style={styles.compItem}>
              <Text style={styles.compLabel}>THỰC TẾ</Text>
              <Text style={[styles.compVal, { color: alertStyle.valueColor }]}>
                {alertItem.actual}
              </Text>
            </View>
          </View>
        </View>

        {/* Battery device link card */}
        {alertItem.batteryId && (
          <Pressable style={[styles.linkCard, Shadow]} onPress={handleNavigateToBattery}>
            <View style={[styles.miniIconWrap, { backgroundColor: '#FFE5DA' }]}>
              <Ionicons name="battery-charging" size={16} color="#FF5E13" />
            </View>
            <View style={styles.linkCardInfo}>
              <Text style={styles.linkCardTitle}>
                {battery ? battery.batteryTypeName : 'Battery Device'}
              </Text>
              <Text style={styles.linkCardMeta}>
                {battery ? battery.serialNumber : 'View details'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
          </Pressable>
        )}

        {/* Ticket link card */}
        {alertItem.ticketCode && (
          <Pressable style={[styles.linkCard, Shadow]} onPress={handleNavigateToTicket}>
            <View style={[styles.miniIconWrap, { backgroundColor: '#EBF3FF' }]}>
              <Ionicons name="ticket" size={16} color="#5081C7" />
            </View>
            <View style={styles.linkCardInfo}>
              <Text style={styles.linkCardTitle}>Ticket {alertItem.ticketCode} đã tạo</Text>
              <Text style={styles.linkCardMeta}>Chạm để mở chi tiết</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
          </Pressable>
        )}
      </View>

      {/* Acknowledge Action Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.ackBtn, Shadow, alertItem.acknowledged && styles.ackBtnDisabled]}
          onPress={handleAcknowledge}
          disabled={alertItem.acknowledged}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#FF5E13" style={{ marginRight: 6 }} />
          <Text style={styles.ackBtnText}>
            {alertItem.acknowledged ? 'Đã xác nhận' : 'Acknowledge'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textMute,
  },
  backBtnText: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  largeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 14,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  timeText: {
    fontSize: 12,
    color: Colors.textMute,
    marginTop: 4,
    marginBottom: 18,
  },
  compBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card2,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-between',
  },
  compItem: {
    flex: 1,
    alignItems: 'center',
  },
  compLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMute,
    marginBottom: 4,
  },
  compVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  miniIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkCardInfo: {
    flex: 1,
  },
  linkCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  linkCardMeta: {
    fontSize: 11,
    color: Colors.textMute,
    marginTop: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  ackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  ackBtnDisabled: {
    opacity: 0.5,
  },
  ackBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF5E13',
  },
});
