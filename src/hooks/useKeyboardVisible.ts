import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * True when the keyboard is currently visible.
 *
 * Used to drop the safe-area padding (home indicator) in the composer while the keyboard
 * is open — at that point the keyboard already covers the home indicator area, so the
 * padding becomes extra whitespace.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // iOS uses willShow/willHide to change layout in sync with KeyboardAvoidingView's animation.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
}
