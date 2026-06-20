import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDeactivateAccount } from '../../../src/features/account/hooks/useDeactivateAccount';
import { useDeleteAccount } from '../../../src/features/account/hooks/useDeleteAccount';
import { useExportMyData } from '../../../src/features/account/hooks/useExportMyData';
import { handleErrorApi } from '../../../src/lib/errors';
import { Colors } from '../../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DangerZoneScreen() {
  const deactivate = useDeactivateAccount();
  const deleteAccount = useDeleteAccount();
  const exportData = useExportMyData();

  const handleExport = () => {
    // non-form → onError trực tiếp. Share sheet tự mở khi success.
    exportData.mutate(undefined, {
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Vô hiệu hóa tài khoản',
      'Tài khoản sẽ bị vô hiệu hóa. Bạn có thể liên hệ hỗ trợ để khôi phục. Tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Vô hiệu hóa',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Xác nhận lần cuối', 'Bạn chắc chắn muốn vô hiệu hóa?', [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Xác nhận',
                style: 'destructive',
                // non-form → onError trực tiếp
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
      'Xóa tài khoản',
      'Tài khoản sẽ bị xóa vĩnh viễn và không thể khôi phục. Tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tài khoản',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Xác nhận lần cuối', 'Bạn chắc chắn muốn xóa tài khoản?', [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Xóa vĩnh viễn',
                style: 'destructive',
                // non-form → onError trực tiếp
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
          Các hành động dưới đây có tính chất nhạy cảm và ảnh hưởng trực tiếp đến tài khoản. Hãy cân nhắc thật kỹ.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dữ liệu cá nhân (GDPR)</Text>
        <Text style={styles.sectionDesc}>
          Tải về toàn bộ dữ liệu cá nhân của bạn dưới dạng tệp JSON (hồ sơ, phiên đăng nhập, nhật ký hoạt động).
        </Text>
        <Pressable style={styles.exportBtn} onPress={handleExport} disabled={exportData.isPending}>
          {exportData.isPending ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.exportBtnText}>Tải dữ liệu của tôi</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vô hiệu hóa tài khoản</Text>
        <Text style={styles.sectionDesc}>
          Tạm thời khóa tài khoản và ẩn các thiết bị của bạn. Bạn có thể khôi phục lại tài khoản bất kỳ lúc nào bằng cách liên hệ bộ phận hỗ trợ.
        </Text>
        <Pressable
          style={styles.deactivateBtn}
          onPress={handleDeactivate}
          disabled={deactivate.isPending}
        >
          <Text style={styles.deactivateBtnText}>Vô hiệu hóa tài khoản</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitleDanger}>Xóa tài khoản vĩnh viễn</Text>
        <Text style={styles.sectionDesc}>
          Hành động này sẽ xóa vĩnh viễn tài khoản của bạn, bao gồm tất cả dữ liệu thiết bị, lịch sử vận hành và vé hỗ trợ. Không thể hoàn tác.
        </Text>
        <Pressable
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={deleteAccount.isPending}
        >
          <Text style={styles.deleteBtnText}>Xóa vĩnh viễn tài khoản</Text>
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
