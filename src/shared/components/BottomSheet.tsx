import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { KeyboardAvoidingView, KeyboardProvider } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/src/lib/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Wraps content in a ScrollView (default true) — keeps long forms from being covered by the keyboard. */
  scroll?: boolean;
}

/**
 * Shared bottom-sheet for form-style modals (Resolve/Escalate/Hold/Rate/Reopen…).
 * Handles: KeyboardAvoidingView (keyboard won't cover the submit button), backdrop tap-to-dismiss,
 * handle bar, and bottom safe-area padding (home indicator won't cover the footer).
 */
export function BottomSheet({ visible, onClose, children, scroll = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* A Modal renders into its own window on Android, outside the app's React root, so it
          does NOT inherit the KeyboardProvider from app/_layout.tsx — it needs its own or the
          KeyboardAvoidingView below gets no keyboard data. */}
      <KeyboardProvider>
        <KeyboardAvoidingView
          style={styles.flex}
          // From react-native-keyboard-controller. RN's version was disabled on Android
          // (behavior undefined) so the keyboard covered the submit button, and it needed a
          // manual negative offset on iOS. This one tracks the keyboard's real height and
          // subtracts the safe area itself.
          behavior="padding"
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
      </KeyboardProvider>
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
