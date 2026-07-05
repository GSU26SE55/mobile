import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, Modal, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLogout } from '../../../src/features/auth/hooks/useLogout';
import { useProfile } from '../../../src/features/profile/hooks/useProfile';
import { useUpdateProfile } from '../../../src/features/profile/hooks/useUpdateProfile';
import { useUploadAvatar } from '../../../src/features/profile/hooks/useUploadAvatar';
import { useTickets } from '../../../src/features/tickets/hooks/useTickets';
import { useMyBatteryAssets } from '../../../src/features/batteries/hooks/useMyBatteryAssets';
import { useMyAlerts } from '../../../src/features/batteries/hooks/useMyAlerts';
import { AlertStatusEnum } from '../../../src/shared/enums/alert.enum';
import { handleErrorApi } from '../../../src/lib/errors';
import { BatteryAssetDto } from '../../../src/features/batteries/types/battery.types';
import { Colors, Shadow } from '../../../src/lib/theme';
import { ProfileForm } from '../../../src/features/profile/components/ProfileForm';

const BATTERY_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Active', color: '#10B981' },
  2: { label: 'Inactive', color: Colors.gray },
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
        <Ionicons name={icon} size={16} color={Colors.text} />
      </View>
      <Text style={styles.linkLabel}>{label}</Text>
      {right || <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />}
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
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
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
        <ActivityIndicator size="large" color={Colors.primary} />
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
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>Profile</Text>
            <Text style={styles.pageSub}>Account & Settings</Text>
          </View>
        </View>

        {/* Profile Info Card */}
        <View style={[styles.profileCard, Shadow]}>
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
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </Pressable>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{account.fullName}</Text>
              <Text style={styles.profileEmail}>{account.email}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>CUSTOMER</Text>
              </View>
            </View>
            <Pressable
              style={styles.editChevron}
              onPress={() => {
                setFieldErrors({});
                setIsEditModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color={Colors.textMute} />
            </Pressable>
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsCard, Shadow]}>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{batteriesLoading ? '-' : batteries.length}</Text>
            <Text style={styles.statLabel}>Devices</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{openCount}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{unreadAlertsCount}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>

        {/* Devices list */}
        {batteries.length > 0 && (
          <>
            <Text style={styles.sectionH}>Devices</Text>
            <View style={[styles.menuCard, Shadow]}>
              {batteries.map((device: BatteryAssetDto, idx: number) => {
                const statusInfo = BATTERY_STATUS_MAP[device.status] ?? { label: 'Unknown', color: Colors.gray };
                return (
                  <View key={device.id}>
                    {idx > 0 && <View style={styles.separator} />}
                    <Pressable style={styles.deviceRow} onPress={() => handleDevicePress(device.id)}>
                      <View style={[styles.deviceIconWrap, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="battery-charging" size={16} color={statusInfo.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deviceLabel}>{device.batteryTypeName}</Text>
                        <Text style={styles.deviceSub}>{device.serialNumber}</Text>
                      </View>
                      <Text style={[styles.deviceStatus, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Security */}
        <Text style={styles.sectionH}>Security</Text>
        <View style={[styles.menuCard, Shadow]}>
          <LinkRow
            icon="lock-closed"
            label="Change Password"
            onPress={() => router.push('/(customer)/settings/change-password')}
          />
          <View style={styles.separator} />
          <LinkRow
            icon="shield-checkmark"
            label="Two-Factor Auth"
            right={
              account.twoFactorEnabled ? (
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>ON</Text>
                </View>
              ) : undefined
            }
            onPress={() => router.push('/(customer)/settings/two-fa')}
          />
          <View style={styles.separator} />
          <LinkRow
            icon="phone-portrait-outline"
            label="Sessions"
            onPress={() => router.push('/(customer)/settings/sessions')}
          />
          <View style={styles.separator} />
          <LinkRow
            icon="warning-outline"
            label="Danger Zone"
            onPress={() => router.push('/(customer)/settings/danger-zone')}
          />
        </View>

        {/* Logout */}
        <Pressable
          style={[styles.logoutBtn, Shadow]}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất"
        >
          <Ionicons name="log-out-outline" size={16} color={Colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
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
            {/* Pressable with empty handler on content container to block touch propagation from overlay */}
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
                  <Ionicons name="close" size={22} color={Colors.text} />
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
  root: { flex: 1, backgroundColor: Colors.bg },
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 110 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flex: 1 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  pageSub: { fontSize: 12, color: Colors.textMute, marginTop: 2 },

  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 58, height: 58, borderRadius: 20, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  profileEmail: { fontSize: 11, color: Colors.textMute, marginTop: 2, fontWeight: '600' },
  roleTag: { backgroundColor: Colors.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6 },
  roleTagText: { fontSize: 8, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  editChevron: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center' },

  statsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  statCol: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 18, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMute, marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.03)' },

  sectionH: { fontSize: 16, fontWeight: '800', color: Colors.text, letterSpacing: -0.3, paddingLeft: 4, paddingBottom: 10, marginTop: 8 },
  menuCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  separator: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)' },

  deviceRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  deviceIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  deviceLabel: { fontSize: 13, fontWeight: '800', color: Colors.text },
  deviceSub: { fontSize: 11, color: Colors.textMute, marginTop: 1 },
  deviceStatus: { fontSize: 10, fontWeight: '700', marginRight: 8 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  linkIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text },
  activeTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeTagText: { fontSize: 9, fontWeight: '700', color: '#4CAF50' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16,
    marginTop: 10, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  logoutText: { fontSize: 13, fontWeight: '800', color: '#DC4F3D' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    fontWeight: '800',
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card2,
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
