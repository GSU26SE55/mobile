import { Stack } from 'expo-router';
import { useStackTransition } from '@/src/hooks/useScreenTransition';
import { BackButton } from '@/src/shared/components/ScreenHeader';

// The settings group has no <Stack.Screen> declared in (customer)/_layout, so it
// renders as a root stack — expo-router has no screen to pop back to, so it won't
// draw a back button automatically. Supplying headerLeft manually so every screen can go back.
export default function SettingsLayout() {
  const screenOptions = useStackTransition();
  return (
    <Stack
      screenOptions={{
        ...screenOptions,
        headerShown: true,
        headerBackTitle: 'Back',
        headerLeft: () => <BackButton variant="bare" />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Account Settings' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
      <Stack.Screen name="change-email" options={{ title: 'Change Email' }} />
      <Stack.Screen name="phone-verify" options={{ title: 'Phone Verification' }} />
      <Stack.Screen name="two-fa" options={{ title: 'Two-Factor Authentication' }} />
      <Stack.Screen name="sessions" options={{ title: 'Login Sessions' }} />
      <Stack.Screen name="trusted-devices" options={{ title: 'Trusted Devices' }} />
      <Stack.Screen name="notification-list" options={{ title: 'Notifications' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notification Settings' }} />
      <Stack.Screen name="permissions" options={{ title: 'Permission Catalog' }} />
      <Stack.Screen name="danger-zone" options={{ title: 'Danger Zone' }} />
    </Stack>
  );
}
