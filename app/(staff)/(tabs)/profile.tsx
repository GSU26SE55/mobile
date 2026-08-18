import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors, Shadow, Solar } from '@/src/lib/theme';
import { StaffHeader } from '@/src/features/staff/components/StaffHeader';
import { useStaffProfile } from '@/src/features/staff/hooks/useStaffProfile';
import { useSessionStore } from '@/src/stores/sessionStore';
import { StaffSkillTierEnum } from '@/src/features/staff/types/staff.types';
import { clearTokens } from '@/src/lib/secureStore';

const TIER_LABEL: Record<StaffSkillTierEnum, string> = {
  Tier1: 'Tier 1 — Junior',
  Tier2: 'Tier 2 — Senior',
  Tier3: 'Tier 3 — Expert',
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
  const { data: profile, isLoading, isError, refetch } = useStaffProfile();
  const clearSession = useSessionStore((s) => s.clearSession);

  const doLogout = async () => {
    await clearTokens();
    clearSession();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: doLogout },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.root}>
        <StaffHeader title="Profile" />
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </View>
    );
  }

  // No mock fallback — if the API fails, show a real error + allow retry + still show the logout button.
  if (isError || !profile) {
    return (
      <View style={styles.root}>
        <StaffHeader title="Profile" />
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textFaint} />
          <Text style={styles.errText}>Failed to load profile</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StaffHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.profileCard, Shadow]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{profile.fullName.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.code}>{profile.employeeCode}</Text>
        <View style={[styles.tierBadge, profile.isAvailable ? styles.tierAvailable : styles.tierUnavailable]}>
          <Text style={styles.tierText}>
            {profile.skillTier ? `${TIER_LABEL[profile.skillTier]} · ` : ''}
            {profile.isAvailable ? 'Available' : 'Busy'}
          </Text>
        </View>
      </View>

      <View style={[styles.infoCard, Shadow]}>
        <InfoRow icon="mail-outline" label="Email" value={profile.email} />
        <InfoRow icon="call-outline" label="Phone" value={profile.phone ?? 'Not set'} />
        <InfoRow icon="business-outline" label="Department" value={profile.department ?? 'Not set'} />
      </View>

      {(profile.skills?.length ?? 0) > 0 && (
        <View style={[styles.skillsCard, Shadow]}>
          <Text style={styles.sectionTitle}>Skills</Text>
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
        onPress={() => router.push('/(staff)/tools')}
      >
        <Ionicons name="build-outline" size={18} color={Colors.text} />
        <Text style={styles.settingsText}>Technical Tools</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMute} />
      </Pressable>

      <Pressable
        style={[styles.settingsBtn, Shadow]}
        onPress={() => router.push('/(staff)/maintenance-history')}
      >
        <Ionicons name="construct-outline" size={18} color={Colors.text} />
        <Text style={styles.settingsText}>Maintenance History</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMute} />
      </Pressable>

      <Pressable
        style={[styles.settingsBtn, Shadow]}
        onPress={() => router.push('/(staff)/notification-preferences')}
      >
        <Ionicons name="notifications-outline" size={18} color={Solar.ink} />
        <Text style={styles.settingsText}>Notification Settings</Text>
        <Ionicons name="chevron-forward" size={18} color={Solar.mute} />
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Solar.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errText: { fontSize: 14, color: Solar.mute, fontWeight: '600' },
  retryBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 14, backgroundColor: Solar.yellow },
  retryText: { fontSize: 14, fontWeight: '800', color: Solar.ink },
  content: { paddingHorizontal: 20, paddingBottom: 120, gap: 14 },

  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(235,230,215,0.7)',
  },
  avatarCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Solar.yellow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: Solar.ink },
  name: { fontSize: 19, fontWeight: '900', color: Solar.ink },
  code: { fontSize: 13, fontWeight: '600', color: Solar.mute },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 4,
  },
  tierAvailable: { backgroundColor: Colors.successLight },
  tierUnavailable: { backgroundColor: Solar.yellowSoft },
  tierText: { fontSize: 12, fontWeight: '700', color: Solar.ink },

  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 16,
    borderWidth: 1, borderColor: 'rgba(235,230,215,0.7)',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: Solar.mute },
  infoValue: { fontSize: 14, fontWeight: '700', color: Solar.ink, marginTop: 1 },

  skillsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 10,
    borderWidth: 1, borderColor: 'rgba(235,230,215,0.7)',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Solar.ink },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: Solar.yellowSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  skillText: { fontSize: 12, fontWeight: '800', color: Solar.yellowDeep },

  settingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(235,230,215,0.7)',
  },
  settingsText: { flex: 1, fontSize: 15, fontWeight: '700', color: Solar.ink },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: Colors.dangerLight, marginTop: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '800', color: Colors.danger },
});
