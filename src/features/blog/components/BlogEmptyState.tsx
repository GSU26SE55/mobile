import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';

interface Props {
  /** `notFound` — post has been removed/archived (BE returns 404 on the detail screen). */
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
        {isNotFound ? 'Post no longer available' : 'No posts yet'}
      </Text>
      <Text style={styles.subtitle}>
        {isNotFound
          ? 'This post may have been removed or archived.'
          : 'Check back later for new published content.'}
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
