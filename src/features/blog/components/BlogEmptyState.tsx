import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../lib/theme';

interface Props {
  /** `notFound` — bài đã bị gỡ/archive (BE trả 404 ở màn chi tiết). */
  variant?: 'list' | 'notFound';
}

export function BlogEmptyState({ variant = 'list' }: Props) {
  const isNotFound = variant === 'notFound';

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={isNotFound ? 'alert-circle-outline' : 'newspaper-outline'}
          size={32}
          color={Colors.textFaint}
        />
      </View>
      <Text style={styles.title}>
        {isNotFound ? 'Bài viết không còn khả dụng' : 'Chưa có bài viết nào'}
      </Text>
      <Text style={styles.subtitle}>
        {isNotFound
          ? 'Bài viết có thể đã được gỡ hoặc lưu trữ.'
          : 'Quay lại sau khi có nội dung mới được xuất bản.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMute,
    textAlign: 'center',
    lineHeight: 18,
  },
});
