import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Colors } from '@/src/lib/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** `white` = white background standing out on the cream background; `sunken` = recessed background (old default). */
  variant?: 'white' | 'sunken';
}

/**
 * Shared search input — recessed background (card2), 12 border radius, NO border.
 * Split out from KbSearchBar when the "Battery Type" screen needed exactly this style;
 * if each screen builds its own, the search input style will drift as it did before
 * (white background + border).
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  variant = 'white',
}: Props) {
  const hasValue = value.length > 0;
  return (
    <View style={[styles.wrap, variant === 'white' ? styles.wrapWhite : styles.wrapSunken]}>
      <Ionicons name="search-outline" size={18} color={Colors.textMute} style={styles.iconLeft} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.placeholder}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {hasValue && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={18} color={Colors.textFaint} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  wrapWhite: { backgroundColor: Colors.white, borderColor: Colors.border },
  wrapSunken: { backgroundColor: Colors.card2, borderColor: 'transparent' },
  iconLeft: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 9,
  },
  clearBtn: { padding: 4 },
});
