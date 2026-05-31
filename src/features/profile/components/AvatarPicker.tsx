import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

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

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
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
        <Text style={styles.editText}>✎</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: 88, height: 88, alignSelf: 'center' },
  avatar:    { width: 88, height: 88, borderRadius: 44 },
  placeholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  initials:  { color: '#fff', fontSize: 28, fontWeight: '600' },
  overlay:   {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  editText:  { color: '#fff', fontSize: 14 },
});
