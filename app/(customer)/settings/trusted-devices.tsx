import React from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTrustedDevices } from '@/src/features/account/hooks/useTrustedDevices';
import { TrustedDeviceCard } from '@/src/features/account/components/TrustedDeviceCard';
import { handleErrorApi } from '@/src/lib/errors';
import { Colors } from '@/src/lib/theme';

export default function TrustedDevicesScreen() {
  const { devices, revokeOne, revokeAll } = useTrustedDevices();

  if (devices.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const data = devices.data ?? [];

  const confirmRevokeOne = (id: string, label: string) => {
    Alert.alert('Revoke device', `Revoke "${label}"? This device will need to verify with 2FA on its next sign-in.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => revokeOne.mutate(id, { onError: (error) => handleErrorApi({ error }) }),
      },
    ]);
  };

  const confirmRevokeAll = () => {
    Alert.alert('Revoke all', 'Revoke all trusted devices? Every device will need to verify with 2FA on its next sign-in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke all',
        style: 'destructive',
        onPress: () => revokeAll.mutate(undefined, { onError: (error) => handleErrorApi({ error }) }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrustedDeviceCard
            device={item}
            onRevoke={(id) => confirmRevokeOne(id, item.label)}
            isRevoking={revokeOne.isPending}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No trusted devices yet.</Text>
        }
        contentContainerStyle={styles.list}
      />

      <Pressable
        style={[styles.revokeAllBtn, (revokeAll.isPending || data.length === 0) && styles.disabledBtn]}
        onPress={confirmRevokeAll}
        disabled={revokeAll.isPending || data.length === 0}
      >
        {revokeAll.isPending ? (
          <ActivityIndicator color={Colors.danger} />
        ) : (
          <Text style={styles.revokeAllText}>Revoke all devices</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  container:     { flex: 1, backgroundColor: Colors.bg },
  list:          { padding: 16 },
  empty:         { textAlign: 'center', color: Colors.textMute, marginTop: 32, fontSize: 14 },
  revokeAllBtn:  {
    margin: 16, backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: Colors.danger,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  disabledBtn:   { borderColor: Colors.graySoft, opacity: 0.5 },
  revokeAllText: { color: Colors.danger, fontSize: 15, fontWeight: '700' },
});
