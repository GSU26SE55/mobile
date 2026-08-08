import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDeactivateAccount } from '@/src/features/account/hooks/useDeactivateAccount';
import { useDeleteAccount } from '@/src/features/account/hooks/useDeleteAccount';
import { useExportMyData } from '@/src/features/account/hooks/useExportMyData';
import { useEraseMyChatData } from '@/src/features/tickets/hooks/useChatInbox';
import { handleErrorApi } from '@/src/lib/errors';
import { Colors } from '@/src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DangerZoneScreen() {
  const deactivate = useDeactivateAccount();
  const deleteAccount = useDeleteAccount();
  const exportData = useExportMyData();
  const eraseChat = useEraseMyChatData();

  const handleEraseChat = () => {
    Alert.alert(
      'Delete chat data',
      'All of your message content will be deleted (replaced with [ERASED]). This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Final confirmation', 'Are you sure you want to delete your chat data?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete permanently',
                style: 'destructive',
                onPress: () =>
                  eraseChat.mutate(undefined, {
                    // BE returns data = null; the deleted count is only in the message.
                    onSuccess: (res) =>
                      Alert.alert('Deleted', res.data.message ?? 'Chat data deleted.'),
                  }),
              },
            ]),
        },
      ],
    );
  };

  const handleExport = () => {
    // non-form → direct onError. Share sheet opens automatically on success.
    exportData.mutate(undefined, {
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate account',
      'Your account will be deactivated. You can contact support to restore it. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Final confirmation', 'Are you sure you want to deactivate your account?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Confirm',
                style: 'destructive',
                // non-form → direct onError
                onPress: () =>
                  deactivate.mutate(undefined, {
                    onError: (error) => handleErrorApi({ error }),
                  }),
              },
            ]),
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete account',
      'Your account will be permanently deleted and cannot be restored. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Final confirmation', 'Are you sure you want to delete your account?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete permanently',
                style: 'destructive',
                // non-form → direct onError
                onPress: () =>
                  deleteAccount.mutate(undefined, {
                    onError: (error) => handleErrorApi({ error }),
                  }),
              },
            ]),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.warningBox}>
        <Ionicons name="warning" size={20} color={Colors.warningDark} style={{ marginRight: 8 }} />
        <Text style={styles.warningText}>
          The actions below are sensitive and directly affect your account. Please consider carefully.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Data (GDPR)</Text>
        <Text style={styles.sectionDesc}>
          Download all of your personal data as a JSON file (profile, login sessions, activity log).
        </Text>
        <Pressable style={styles.exportBtn} onPress={handleExport} disabled={exportData.isPending}>
          {exportData.isPending ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.exportBtnText}>Download my data</Text>
          )}
        </Pressable>

        <Text style={[styles.sectionDesc, { marginTop: 12 }]}>
          Delete all of your chat message content (replaced with [ERASED]). This cannot be undone.
        </Text>
        <Pressable style={styles.deactivateBtn} onPress={handleEraseChat} disabled={eraseChat.isPending}>
          {eraseChat.isPending ? (
            <ActivityIndicator color={Colors.warning} />
          ) : (
            <Text style={styles.deactivateBtnText}>Delete my chat data</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deactivate account</Text>
        <Text style={styles.sectionDesc}>
          Temporarily lock your account and hide your devices. You can restore your account at any time by contacting support.
        </Text>
        <Pressable
          style={styles.deactivateBtn}
          onPress={handleDeactivate}
          disabled={deactivate.isPending}
        >
          <Text style={styles.deactivateBtnText}>Deactivate account</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitleDanger}>Delete account permanently</Text>
        <Text style={styles.sectionDesc}>
          This action will permanently delete your account, including all device data, operation history, and support tickets. This cannot be undone.
        </Text>
        <Pressable
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={deleteAccount.isPending}
        >
          <Text style={styles.deleteBtnText}>Delete account permanently</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: Colors.bg },
  container:         { padding: 24, gap: 20 },
  warningBox:        {
    flexDirection: 'row',
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.25)',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningText:       { flex: 1, fontSize: 13, color: Colors.warningDark, lineHeight: 18, fontWeight: '500' },
  section:           { gap: 8 },
  sectionTitle:      { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionTitleDanger:{ fontSize: 16, fontWeight: '800', color: Colors.danger },
  sectionDesc:       { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  deactivateBtn:     {
    borderWidth: 1.5,
    borderColor: Colors.warning,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deactivateBtnText: { color: Colors.warning, fontSize: 14, fontWeight: '700' },
  deleteBtn:         {
    backgroundColor: Colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteBtnText:     { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  exportBtn:         {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  exportBtnText:     { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  divider:           { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
});
