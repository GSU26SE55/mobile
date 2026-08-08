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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // Sheet is pinned to the bottom of the screen: KAV spans from y=0, so it doesn't
        // subtract the bottom safe-area, pushing up by exactly the home indicator height.
        // The negative offset compensates for that.
        keyboardVerticalOffset={-insets.bottom}
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
