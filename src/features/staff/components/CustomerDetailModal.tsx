import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { BottomSheet } from '@/src/shared/components/BottomSheet';
import { useCustomerAccount } from '../hooks/useCustomerAccount';

interface Props {
  visible: boolean;
  customerId: string | null;
  onClose: () => void;
}

export function CustomerDetailModal({ visible, customerId, onClose }: Props) {
  const { data: customer, isLoading, isError } = useCustomerAccount(customerId, visible);

  return (
    <BottomSheet visible={visible} onClose={onClose} scroll={false}>
      <View style={styles.body}>
        <Text style={styles.title}>Customer information</Text>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="small" />
          </View>
        ) : isError || !customer ? (
          <Text style={styles.errorText}>Could not load customer information.</Text>
        ) : (
          <View style={styles.rows}>
            <Text style={styles.name}>{customer.fullName}</Text>
            <View style={styles.row}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMute} />
              <Text style={styles.value}>{customer.email}</Text>
            </View>
            {customer.phoneNumber && (
              <View style={styles.row}>
                <Ionicons name="call-outline" size={18} color={Colors.textMute} />
                <Text style={styles.value}>{customer.phoneNumber}</Text>
              </View>
            )}
            {customer.address && (
              <View style={styles.row}>
                <Ionicons name="location-outline" size={18} color={Colors.textMute} />
                <Text style={styles.value}>{customer.address}</Text>
              </View>
            )}
          </View>
        )}

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  center: { paddingVertical: 24, alignItems: 'center' },
  errorText: { fontSize: 13, color: Colors.danger },
  rows: { gap: 12 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { flex: 1, fontSize: 13.5, color: Colors.text, fontWeight: '500' },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.card2,
    alignItems: 'center',
  },
  closeText: { fontSize: 14, fontWeight: '700', color: Colors.text },
});
