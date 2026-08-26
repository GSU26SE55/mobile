import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Font, Solar } from '@/src/lib/theme';

// New Home header (shared between staff + customer): round avatar + greeting + subtitle,
// action on the right (notification bell). Colors keep the current palette.

interface Props {
  name: string;
  subtitle?: string;
  avatarUrl?: string | null;
  avatarColor?: string; // avatar background when there's no image
  unreadCount?: number;
  showDot?: boolean; // small red dot (when not using a number)
  onBellPress?: () => void;
}

function initialOf(name: string) {
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() : '?';
}

export function HomeHeader({
  name,
  subtitle,
  avatarUrl,
  avatarColor = Colors.primary,
  unreadCount = 0,
  showDot = false,
  onBellPress,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: avatarUrl ? Colors.card2 : avatarColor }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{initialOf(name)}</Text>
        )}
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.greeting} numberOfLines={1}>
          Hello {name}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Pressable style={styles.bell} onPress={onBellPress} hitSlop={8}>
        <Ionicons name="notifications-outline" size={20} color={Colors.accent} />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        ) : showDot ? (
          <View style={styles.dot} />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 18, fontWeight: '700', color: Solar.ink },
  textWrap: { flex: 1 },
  greeting: { ...Font.title },
  subtitle: { ...Font.meta, marginTop: 2 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Solar.card,
    borderWidth: 1,
    borderColor: Solar.cardEdge,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Solar.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 7.5,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: Solar.white, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  dot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
});
