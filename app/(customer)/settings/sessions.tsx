import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSessions } from '../../../src/features/account/hooks/useSessions';
import { SessionCard } from '../../../src/features/account/components/SessionCard';
import { handleErrorApi } from '../../../src/lib/errors';

export default function SessionsScreen() {
  const { sessions, revokeSession, revokeAll } = useSessions();

  if (sessions.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
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
              // non-form → onError trực tiếp
              revokeSession.mutate(id, {
                onError: (error) => handleErrorApi({ error }),
              });
            }}
            isRevoking={revokeSession.isPending}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Không có phiên nào đang hoạt động.</Text>
        }
        contentContainerStyle={styles.list}
      />

      <Pressable
        style={styles.revokeAllBtn}
        onPress={() => {
          // non-form → onError trực tiếp
          revokeAll.mutate(undefined, {
            onSuccess: () => {},
            onError: (error) => handleErrorApi({ error }),
          });
        }}
        disabled={revokeAll.isPending || data.filter((s) => !s.isCurrent).length === 0}
      >
        {revokeAll.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.revokeAllText}>Đăng xuất tất cả thiết bị khác</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container:     { flex: 1 },
  list:          { padding: 16 },
  empty:         { textAlign: 'center', color: '#9ca3af', marginTop: 32 },
  revokeAllBtn:  {
    margin: 16, backgroundColor: '#6366f1',
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  revokeAllText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
