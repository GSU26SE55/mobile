import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSessions } from '../../../src/features/account/hooks/useSessions';
import { SessionCard } from '../../../src/features/account/components/SessionCard';
import { handleErrorApi } from '../../../src/lib/errors';
import { Colors } from '../../../src/lib/theme';

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
        style={[styles.revokeAllBtn, (revokeAll.isPending || data.filter((s) => !s.isCurrent).length === 0) && styles.disabledBtn]}
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
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text style={styles.revokeAllText}>Đăng xuất tất cả thiết bị khác</Text>
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
