import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/src/lib/theme';

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
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={[styles.btn, Shadow]}
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
      >
        <Ionicons name="chevron-back" size={18} color={Colors.text} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.btn}>{right}</View>
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
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 8,
  },
});
