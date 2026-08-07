import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Colors } from '@/src/lib/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** `white` = nền trắng nổi trên nền kem; `sunken` = nền chìm (mặc định cũ). */
  variant?: 'white' | 'sunken';
}

/**
 * Ô tìm kiếm dùng chung — nền chìm (card2), bo 12, KHÔNG viền.
 * Tách ra từ KbSearchBar khi màn "Loại pin" cần đúng kiểu này; để mỗi màn tự
 * dựng lại thì kiểu ô search sẽ lệch nhau như trước (nền trắng + viền).
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
