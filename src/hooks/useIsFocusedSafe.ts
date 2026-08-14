import { useContext, useEffect, useState } from 'react';
import { NavigationContext } from '@react-navigation/native';

/**
 * `useIsFocused()` that also works outside a navigator.
 *
 * React Navigation's own `useIsFocused` throws "Couldn't find a navigation object" when the
 * component calling it is not inside a screen. The floating chat bubble (BubbleChatRoot) is
 * mounted above the Expo Router tree, so every data hook it uses hit that crash.
 *
 * Inside a screen this behaves exactly like `useIsFocused`. Outside a navigator it reports
 * focused, which is the right answer there: such a component is visible for as long as it
 * stays mounted, so polling should keep running.
 */
export function useIsFocusedSafe(): boolean {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => navigation?.isFocused() ?? true);

  useEffect(() => {
    if (!navigation) return;

    setFocused(navigation.isFocused());
    const unsubscribeFocus = navigation.addListener('focus', () => setFocused(true));
    const unsubscribeBlur = navigation.addListener('blur', () => setFocused(false));

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  return focused;
}
