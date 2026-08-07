import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/src/lib/theme';
import { useSessionStore } from '@/src/stores/sessionStore';

interface BackButtonProps {
  /** Ghi đè hành vi back (mặc định: pop, fallback về tab gốc nếu không pop được). */
  onPress?: () => void;
  /** `bare` = chỉ chevron, không nền — dùng cho headerLeft của Stack. */
  variant?: 'card' | 'bare';
}

/**
 * Nút back DÙNG CHUNG cho toàn app — mọi màn hình phải dùng cái này,
 * không tự dựng Pressable + chevron riêng nữa (trước đây mỗi màn một size
 * 18/22/26 và hitSlop khác nhau).
 *
 * `canGoBack()` guard: vào thẳng bằng deep-link (push notification) thì stack
 * rỗng, `router.back()` sẽ no-op và nút chết — nên fallback về tab gốc theo role.
 */
export function BackButton({ onPress, variant = 'card' }: BackButtonProps) {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    const role = useSessionStore.getState().user?.role;
    router.replace(role === 'STAFF' ? '/(staff)/(tabs)/dashboard' : '/(customer)/(tabs)/dashboard');
  };

  return (
    <Pressable
      onPress={onPress ?? goBack}
      hitSlop={8}
      style={({ pressed }) => [
        variant === 'card' ? styles.btn : styles.btnBare,
        variant === 'card' && Shadow,
        pressed && { opacity: 0.6 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Quay lại"
    >
      <Ionicons name="chevron-back" size={variant === 'card' ? 18 : 26} color={Colors.text} />
    </Pressable>
  );
}

interface Props {
  title: string;
  /** Ghi đè hành vi nút back (mặc định router.back()). */
  onBack?: () => void;
  /** Nút phụ bên phải (optional). */
  right?: React.ReactNode;
}

/**
 * Header dùng chung cho các màn staff/detail (headerShown:false ở Stack) —
 * xử lý safe-area top + nút back nhất quán (44×44, đủ touch target).
 */
export function ScreenHeader({ title, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <BackButton onPress={onBack} />
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {/* Không có `right` thì chỉ giữ chỗ cho cân title — KHÔNG vẽ nền card,
          nếu không sẽ hiện ra ô vuông trắng rỗng bên phải header. */}
      <View style={right ? styles.btn : styles.btnSpacer}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.bg,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBare: {
    paddingRight: 8,
    justifyContent: 'center',
  },
  btnSpacer: {
    width: 44,
    height: 44,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 8,
  },
});
