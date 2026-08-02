import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, Modal, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLogout } from '@/src/features/auth/hooks/useLogout';
import { useProfile } from '@/src/features/profile/hooks/useProfile';
import { useUpdateProfile } from '@/src/features/profile/hooks/useUpdateProfile';
import { useUploadAvatar } from '@/src/features/profile/hooks/useUploadAvatar';
import { useTickets } from '@/src/features/tickets/hooks/useTickets';
import { useMyBatteryAssets } from '@/src/features/batteries/hooks/useMyBatteryAssets';
import { useMyAlerts } from '@/src/features/batteries/hooks/useMyAlerts';
import { AlertStatusEnum } from '@/src/shared/enums/alert.enum';
import { handleErrorApi } from '@/src/lib/errors';
import { BatteryAssetDto } from '@/src/features/batteries/types/battery.types';
import { Colors, Solar } from '@/src/lib/theme';
import { ProfileForm } from '@/src/features/profile/components/ProfileForm';
import { EnergyBackdrop, GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';

const BATTERY_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Đang hoạt động', color: Colors.success },
  2: { label: 'Tạm dừng', color: Solar.mute },
  3: { label: 'Ngừng sử dụng', color: Colors.danger },
};

function LinkRow({
  icon,
  label,
  right,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.linkRow} onPress={onPress}>
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={16} color={Solar.ink} />
      </View>
      <Text style={styles.linkLabel}>{label}</Text>
      {right || <Ionicons name="chevron-forward" size={14} color={Solar.mute} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data: account, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const logout = useLogout();

  const { data: ticketsData, isLoading: ticketsLoading } = useTickets({ PageSize: 100 });
  const { data: batteries = [], isLoading: batteriesLoading } = useMyBatteryAssets();
  const { data: alerts = [] } = useMyAlerts();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi ứng dụng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout.mutate() },
    ]);
  };

  const handleUpdateProfile = async (data: any) => {
    setFieldErrors({});
    try {
      await updateProfile.mutateAsync(data);
      setIsEditModalVisible(false);
    } catch (error) {
      handleErrorApi({
        error,
        setFieldError: (field, msg) => setFieldErrors((prev) => ({ ...prev, [field]: msg })),
      });
    }
  };

  if (profileLoading || ticketsLoading) {
    return (
      <View style={styles.center}>
        <EnergyBackdrop />
        <ActivityIndicator size="large" color={Solar.yellowDeep} />
      </View>
    );
  }

  if (!account) return null;

  const tickets = ticketsData?.items ?? [];
  const openCount = tickets.filter((t) =>
    ['New', 'Open', 'Assigned', 'InProgress', 'WaitingCustomer', 'WaitingParts', 'WaitingOnsiteSchedule'].includes(t.status)
  ).length;
  const unreadAlertsCount = alerts.filter((a) => a.status === AlertStatusEnum.Open).length;

  const initials = (account.fullName ?? 'KH')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleDevicePress = (id: string) => {
    router.push({ pathname: '/(customer)/batteries/[id]', params: { id } });
  };

  return (
    <View style={styles.root}>
      <EnergyBackdrop />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>Tài khoản</Text>
            <Text style={styles.pageSub}>Thông tin cá nhân & Cài đặt hệ thống</Text>
          </View>
        </View>

        {/* Profile Info Card */}
        <GlassSurface style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Pressable
              style={styles.avatar}
              onPress={() =>
                uploadAvatar.mutate(undefined, {
                  onError: (error) => handleErrorApi({ error }),
                })
              }
            >
              {uploadAvatar.isPending ? (
                <ActivityIndicator color={Solar.ink} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </Pressable>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{account.fullName}</Text>
              <Text style={styles.profileEmail}>{account.email}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>KHÁCH HÀNG</Text>
              </View>
            </View>
            <Pressable
              style={styles.editChevron}
              onPress={() => {
                setFieldErrors({});
                setIsEditModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color={Solar.ink} />
            </Pressable>
          </View>
        </GlassSurface>

        {/* Stats row */}
        <GlassSurface style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{batteriesLoading ? '-' : batteries.length}</Text>
            <Text style={styles.statLabel}>Thiết bị</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{openCount}</Text>
            <Text style={styles.statLabel}>Ticket mở</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{unreadAlertsCount}</Text>
            <Text style={styles.statLabel}>Cảnh báo</Text>
          </View>
        </GlassSurface>

        {/* Devices list */}
        {batteries.length > 0 && (
          <>
            <Text style={styles.sectionH}>Thiết bị lưu trữ của tôi</Text>
            <GlassSurface style={styles.menuCard}>
              {batteries.map((device: BatteryAssetDto, idx: number) => {
                const statusInfo = BATTERY_STATUS_MAP[device.status] ?? { label: 'Chưa rõ', color: Solar.mute };
                return (
                  <View key={device.id}>
                    {idx > 0 && <View style={styles.separator} />}
                    <Pressable style={styles.deviceRow} onPress={() => handleDevicePress(device.id)}>
                      <View style={styles.deviceIconWrap}>
                        <Ionicons name="battery-charging" size={16} color={Solar.yellowDeep} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deviceLabel}>{device.batteryTypeName || 'Pin lưu trữ'}</Text>
                        <Text style={styles.deviceSub}>{device.serialNumber}</Text>
                      </View>
                      <Text style={[styles.deviceStatus, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                      <Ionicons name="chevron-forward" size={14} color={Solar.mute} />
                    </Pressable>
                  </View>
                );
              })}
            </GlassSurface>
          </>
        )}

        {/* Security */}
        <Text style={styles.sectionH}>Bảo mật & Tài khoản</Text>
        <GlassSurface style={styles.menuCard}>
          <LinkRow
            icon="lock-closed-outline"
            label="Đổi mật khẩu"
            onPress={() => router.push('/(customer)/settings/change-password')}
          />
          <View style={styles.separator} />
          <LinkRow
            icon="shield-checkmark-outline"
            label="Xác thực 2 yếu tố (2FA)"
            right={
              account.twoFactorEnabled ? (
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>ĐÃ BẬT</Text>
                </View>
              ) : undefined
            }
            onPress={() => router.push('/(customer)/settings/two-fa')}
          />
          <View style={styles.separator} />
          <LinkRow
            icon="phone-portrait-outline"
            label="Phiên đăng nhập"
            onPress={() => router.push('/(customer)/settings/sessions')}
          />
          <View style={styles.separator} />
          <LinkRow
            icon="warning-outline"
            label="Cấu hình nâng cao"
            onPress={() => router.push('/(customer)/settings/danger-zone')}
          />
        </GlassSurface>

        {/* Logout */}
        <Pressable
          style={styles.logoutBtn}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất"
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Đăng xuất khỏi tài khoản</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardOverlayView}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setIsEditModalVisible(false)}>
            <Pressable
              style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
              onPress={() => {}}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setIsEditModalVisible(false)}
                >
                  <Ionicons name="close" size={22} color={Solar.ink} />
                </Pressable>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalFormScroll}
              >
                <ProfileForm
                  account={account}
                  onSubmit={handleUpdateProfile}
                  isLoading={updateProfile.isPending}
                  fieldErrors={fieldErrors}
                />
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Solar.bg },
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Solar.bg },
  content: { paddingHorizontal: 20, paddingBottom: 110 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: Solar.ink, letterSpacing: -0.5 },
  pageSub: { fontSize: 12, color: Solar.mute, marginTop: 2, fontWeight: '600' },

  profileCard: {
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: Solar.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarText: { color: Solar.ink, fontWeight: '900', fontSize: 20 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '900', color: Solar.ink },
  profileEmail: { fontSize: 11, color: Solar.mute, marginTop: 2, fontWeight: '600' },
  roleTag: {
    backgroundColor: 'rgba(255, 213, 0, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleTagText: { fontSize: 9, fontWeight: '900', color: Solar.ink, letterSpacing: 0.5 },
  editChevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 215, 0.7)',
  },

  statsCard: {
    borderRadius: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statCol: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 20, fontWeight: '900', color: Solar.ink },
  statLabel: { fontSize: 11, color: Solar.mute, marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 26, backgroundColor: 'rgba(235, 230, 215, 0.7)' },

  sectionH: { fontSize: 17, fontWeight: '900', color: Solar.ink, letterSpacing: -0.3, paddingLeft: 4, paddingBottom: 10, marginTop: 8 },
  menuCard: {
    borderRadius: 24,
    marginBottom: 14,
    overflow: 'hidden',
  },
  separator: { height: 1, backgroundColor: 'rgba(235, 230, 215, 0.6)' },

  deviceRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  deviceIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255, 245, 180, 0.65)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  deviceLabel: { fontSize: 14, fontWeight: '900', color: Solar.ink },
  deviceSub: { fontSize: 11, color: Solar.mute, marginTop: 2, fontWeight: '600' },
  deviceStatus: { fontSize: 11, fontWeight: '800', marginRight: 8 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  linkIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255, 245, 180, 0.45)', alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: Solar.ink },
  activeTag: { backgroundColor: 'rgba(52, 199, 89, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeTagText: { fontSize: 9, fontWeight: '900', color: Colors.success },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 215, 0.7)',
    shadowColor: '#8C7A4B',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '900', color: Colors.danger },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 15, 5, 0.4)',
    justifyContent: 'flex-end',
  },
  keyboardOverlayView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Solar.ink,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245, 240, 225, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    flexGrow: 0,
  },
  modalFormScroll: {
    paddingBottom: 16,
  },
});
