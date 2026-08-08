import React from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSessions } from '@/src/features/account/hooks/useSessions';
import { SessionCard } from '@/src/features/account/components/SessionCard';
import { handleErrorApi } from '@/src/lib/errors';
import { Colors } from '@/src/lib/theme';

export default function SessionsScreen() {
  const { sessions, revokeSession, revokeAll } = useSessions();

  if (sessions.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const data = sessions.data ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onRevoke={(id) => {
              Alert.alert('Revoke session', 'Sign this device out of your account?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Revoke',
                  style: 'destructive',
                  // non-form → onError directly
                  onPress: () => revokeSession.mutate(id, { onError: (error) => handleErrorApi({ error }) }),
                },
              ]);
            }}
            isRevoking={revokeSession.isPending}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No active sessions.</Text>
        }
        contentContainerStyle={styles.list}
      />

      <Pressable
        style={[styles.revokeAllBtn, (revokeAll.isPending || data.filter((s) => !s.isCurrent).length === 0) && styles.disabledBtn]}
        onPress={() => {
          Alert.alert('Sign out other devices', 'Sign out of all sessions except this device?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign out',
              style: 'destructive',
              // non-form → onError directly
              onPress: () => revokeAll.mutate(undefined, { onError: (error) => handleErrorApi({ error }) }),
            },
          ]);
        }}
        disabled={revokeAll.isPending || data.filter((s) => !s.isCurrent).length === 0}
      >
        {revokeAll.isPending ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text style={styles.revokeAllText}>Sign out all other devices</Text>
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
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  disabledBtn:   {
    borderColor: Colors.graySoft,
    opacity: 0.5,
  },
  revokeAllText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
});
