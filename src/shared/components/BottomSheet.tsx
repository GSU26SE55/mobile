import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '../../lib/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Bọc nội dung trong ScrollView (mặc định true) — form dài không bị bàn phím che. */
  scroll?: boolean;
}

/**
 * Bottom-sheet dùng chung cho các modal dạng form (Resolve/Escalate/Hold/Rate/Reopen…).
 * Xử lý sẵn: KeyboardAvoidingView (bàn phím không che nút submit), backdrop tap-to-dismiss,
 * handle bar, và padding safe-area đáy (home indicator không che footer).
 */
export function BottomSheet({ visible, onClose, children, scroll = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, Shadow, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 8,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.card3,
    alignSelf: 'center',
    marginBottom: 12,
  },
});
