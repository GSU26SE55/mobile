import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow } from '@/src/lib/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function KbDetailSection({
  icon,
  iconColor = Colors.primary,
  iconBg = Colors.primaryLight,
  title,
  style,
  bodyStyle,
  children,
}: Props) {
  return (
    <View style={[styles.card, Shadow, style]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={[styles.body, bodyStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 16,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  body: {
    paddingLeft: 2,
  },
});
