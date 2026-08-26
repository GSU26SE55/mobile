import { Stack } from 'expo-router';
import { useStackTransition } from '@/src/hooks/useScreenTransition';
import { BackButton } from '@/src/shared/components/ScreenHeader';

// GH-68 — cross-ticket chat group (inbox + mentions). Header uses Stack (like settings/kb).
// This group has no <Stack.Screen> declared in (customer)/_layout, so it renders as a
// root stack — no screen to pop back to, expo-router won't draw a back button automatically.
// Supplying headerLeft manually.
//
// Mentioning happens inline in the ticket chat: typing "@" opens the member picker there.
// The mentions screen is a cross-ticket digest kept out of the main flow — no entry point.
export default function ChatsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Chat Inbox' }} />
      <Stack.Screen name="mentions" options={{ title: 'Mentions' }} />
    </Stack>
  );
}
