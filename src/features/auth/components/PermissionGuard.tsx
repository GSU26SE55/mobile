import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, ShadowPrimary } from '@/src/lib/theme';
import { checkPermission, Permission } from '@/src/lib/authz';
import { useSessionStore } from '@/src/stores/sessionStore';

interface Props {
  permission: Permission;
  children: React.ReactNode;
}

/**
 * GH-47 — guards a screen by permission. Has permission → render children;
 * missing permission → "No access" fallback + back button. Used for read-screen + create-screen.
 */
export function PermissionGuard({ permission, children }: Props) {
  const user = useSessionStore((s) => s.user);

  if (!checkPermission(user, permission)) {
    return (
      <View style={styles.container}>
        <Ionicons name="lock-closed-outline" size={44} color={Colors.textFaint} />
        <Text style={styles.title}>You don&apos;t have access</Text>
        <Text style={styles.subtitle}>This content requires a permission that hasn&apos;t been granted to your account.</Text>
        <Pressable style={[styles.btn, ShadowPrimary]} onPress={() => router.back()}>
          <Text style={styles.btnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    backgroundColor: Colors.bg,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMute,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 12,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
