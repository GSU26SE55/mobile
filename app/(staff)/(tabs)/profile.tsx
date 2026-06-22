import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadow, ShadowPrimary } from '../../../src/lib/theme';
import { useStaffProfile } from '../../../src/features/staff/hooks/useStaffProfile';
import { useSessionStore } from '../../../src/stores/sessionStore';
import { StaffProfileDTO, StaffSkillTierEnum } from '../../../src/features/staff/types/staff.types';
import { clearTokens } from '../../../src/lib/secureStore';

const TIER_LABEL: Record<StaffSkillTierEnum, string> = {
  Tier1: 'Tier 1 — Junior',
  Tier2: 'Tier 2 — Senior',
  Tier3: 'Tier 3 — Expert',
};

const MOCK_PROFILE: StaffProfileDTO = {
  accountId: 'me',
  employeeCode: 'STF-001',
  fullName: 'Trần Văn Kỹ thuật',
  email: 'tranvan@company.com',
  phone: '0901234567',
  department: 'Bảo trì Solar',
  skillTier: 'Tier2',
  maxConcurrentTickets: 5,
  currentTicketCount: 3,
  isAvailable: true,
  notes: null,
  skills: ['Inverter', 'Pin lithium-ion', 'BMS firmware'],
  avatarUrl: null,
};

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={Colors.textMute} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function StaffProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data: apiProfile, isLoading, isError } = useStaffProfile();
  const clearSession = useSessionStore((s) => s.clearSession);

  const profile = apiProfile ?? MOCK_PROFILE;

  const handleLogout = async () => {
    await clearTokens();
    clearSession();
    router.replace('/(auth)/login');
  };

  if (isLoading && !apiProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.screenTitle}>Cá nhân</Text>

      {isError && (
        <View style={styles.warnBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color="#92400e" />
          <Text style={styles.warnText}>Không tải được thông tin — đang hiển thị dữ liệu mẫu</Text>
        </View>
      )}

      <View style={[styles.profileCard, Shadow]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{profile.fullName.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.code}>{profile.employeeCode}</Text>
        <View style={[styles.tierBadge, profile.isAvailable ? styles.tierAvailable : styles.tierUnavailable]}>
          <View style={[styles.availDot, { backgroundColor: profile.isAvailable ? Colors.success : Colors.textFaint }]} />
          <Text style={styles.tierText}>
            {TIER_LABEL[profile.skillTier]} · {profile.isAvailable ? 'Sẵn sàng' : 'Bận'}
          </Text>
        </View>
      </View>

      <View style={[styles.statsCard, Shadow]}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{profile.currentTicketCount}</Text>
          <Text style={styles.statLabel}>Đang xử lý</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{profile.maxConcurrentTickets}</Text>
          <Text style={styles.statLabel}>Tối đa</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.primary }]}>
            {profile.maxConcurrentTickets - profile.currentTicketCount}
          </Text>
          <Text style={styles.statLabel}>Còn trống</Text>
        </View>
      </View>

      <View style={[styles.infoCard, Shadow]}>
        <InfoRow icon="mail-outline" label="Email" value={profile.email} />
        <InfoRow icon="call-outline" label="Điện thoại" value={profile.phone ?? 'Chưa cập nhật'} />
        <InfoRow icon="business-outline" label="Phòng ban" value={profile.department ?? 'Chưa cập nhật'} />
      </View>

      {(profile.skills?.length ?? 0) > 0 && (
        <View style={[styles.skillsCard, Shadow]}>
          <Text style={styles.sectionTitle}>Chuyên môn</Text>
          <View style={styles.skillsWrap}>
            {(profile.skills ?? []).map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Pressable
        style={[styles.settingsBtn, Shadow]}
        onPress={() => router.push('/(staff)/notification-preferences')}
      >
        <Ionicons name="notifications-outline" size={18} color={Colors.text} />
        <Text style={styles.settingsText}>Cài đặt thông báo</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMute} />
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  warnBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  warnText: { fontSize: 12, color: '#92400e', flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120, gap: 14 },
  screenTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },

  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: Colors.primaryDark },
  name: { fontSize: 18, fontWeight: '800', color: Colors.text },
  code: { fontSize: 13, fontWeight: '600', color: Colors.textMute },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 4,
  },
  tierAvailable: { backgroundColor: Colors.successLight },
  tierUnavailable: { backgroundColor: Colors.card2 },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  tierText: { fontSize: 12, fontWeight: '700', color: Colors.text },

  statsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMute },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },

  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: Colors.textFaint },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 1 },

  skillsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  skillText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },

  settingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14,
    backgroundColor: Colors.card,
  },
  settingsText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.dangerLight, marginTop: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: Colors.danger },
});
