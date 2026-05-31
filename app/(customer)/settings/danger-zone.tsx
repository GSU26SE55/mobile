import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useDeactivateAccount } from '../../../src/features/account/hooks/useDeactivateAccount';
import { useDeleteAccount } from '../../../src/features/account/hooks/useDeleteAccount';
import { handleErrorApi } from '../../../src/lib/errors';

export default function DangerZoneScreen() {
  const deactivate = useDeactivateAccount();
  const deleteAccount = useDeleteAccount();

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.warning}>
        ⚠️ Các hành động bên dưới không thể hoàn tác. Hãy cân nhắc kỹ trước khi thực hiện.
      </Text>

      <Pressable
        style={styles.deactivateBtn}
        onPress={handleDeactivate}
        disabled={deactivate.isPending}
      >
        <Text style={styles.deactivateText}>Vô hiệu hóa tài khoản</Text>
        <Text style={styles.subtitle}>Tạm thời — có thể khôi phục qua hỗ trợ</Text>
      </Pressable>

      <Pressable
        style={styles.deleteBtn}
        onPress={handleDelete}
        disabled={deleteAccount.isPending}
      >
        <Text style={styles.deleteText}>Xóa tài khoản vĩnh viễn</Text>
        <Text style={[styles.subtitle, { color: '#fca5a5' }]}>Không thể khôi phục</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { padding: 24, gap: 16 },
  warning:        {
    backgroundColor: '#fef3c7', borderRadius: 8, padding: 12,
    fontSize: 13, color: '#92400e', lineHeight: 18,
  },
  deactivateBtn:  { borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10, padding: 16 },
  deactivateText: { fontSize: 15, color: '#b45309', fontWeight: '600' },
  deleteBtn:      { backgroundColor: '#ef4444', borderRadius: 10, padding: 16 },
  deleteText:     { fontSize: 15, color: '#fff', fontWeight: '600' },
  subtitle:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
