import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { getAccessToken } from '@/src/lib/secureStore';
import { Colors } from '@/src/lib/theme';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

interface Props {
  displayAvatarUrl: string | null;
  fullName: string;
  onPress: () => void;
  isLoading?: boolean;
}

export function AvatarPicker({ displayAvatarUrl, fullName, onPress, isLoading }: Props) {
  const initials = fullName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const avatarUri = displayAvatarUrl ? `${BASE_URL}${displayAvatarUrl}` : null;

  // displayAvatarUrl trỏ tới GET /api/files/{id}/download — endpoint CẦN auth.
  // RN <Image> không tự gắn Bearer → phải truyền header thủ công, nếu không avatar trả 401.
  const [authHeaders, setAuthHeaders] = useState<{ Authorization: string } | undefined>(undefined);
  useEffect(() => {
    let active = true;
    getAccessToken().then((token) => {
      if (active && token) setAuthHeaders({ Authorization: `Bearer ${token}` });
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri, headers: authHeaders }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}
      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
      <View style={styles.editBadge}>
        <Ionicons name="camera" size={12} color="#fff" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:   { width: 88, height: 88, alignSelf: 'center' },
  avatar:      { width: 88, height: 88, borderRadius: 44 },
  placeholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#EF5128', shadowOpacity: 0.3, shadowRadius: 7, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 6 },
    }),
  },
  initials:    { color: '#fff', fontSize: 28, fontWeight: '700' },
  overlay:     {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  editBadge:   {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bg,
  },
});
