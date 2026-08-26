import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useStackTransition } from '@/src/hooks/useScreenTransition';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from '@/src/context/authContext';
import { PermissionsSync } from '@/src/features/auth/components/PermissionsSync';
import { NotificationBootstrap } from '@/src/features/notifications/components/NotificationBootstrap';
import { configureGoogleSignin } from '@/src/config/googleAuth';

// Import side-effect: TaskManager.defineTask MUST run at top-level, BEFORE the React tree builds.
// The OS restarts the JS runtime to run the background task when the app has been killed — at that
// point there's no component at all, so the task must already be registered from module scope.
import '@/src/features/notifications/lib/backgroundSync';

// Configure Google Sign-In once when the app boots.
configureGoogleSignin();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Auth guard is DECLARATIVE (<Redirect> in app/index.tsx + (customer)/(staff) layout).
// Do NOT add a router.replace() based on auth state here: it runs in an effect, so it fires
// in the same commit as <Redirect>, and the two overlapping navigations right after hydration
// cause a Fabric crash `addViewAt: The specified child already has a parent`.
function RootLayoutNav() {
  const screenOptions = useStackTransition();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(staff)" />
      <Stack.Screen name="notification/chat" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Reports the real keyboard height/animation to the whole tree. Required because the app
          runs edge-to-edge (android.edgeToEdgeEnabled): Android then does NOT resize the window
          for the keyboard, so RN's built-in KeyboardAvoidingView computes the wrong offset and
          the composer jumps up/down out of sync. Must wrap everything that has an input. */}
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PermissionsSync />
            {/* Permissions + Android channel, SignalR realtime, background sync, badge.
                Notifications arrive via SignalR and are shown via local notification — this app does
                NOT use Expo remote push, so it never registers a device token with the BE. The
                client half of that (device-token service/types, DevicePlatformEnum, the
                DEVICE_TOKENS endpoint) is deleted, not merely unused — re-adding it is a decision,
                not a fix. GH-83's PushResponseHandler was removed for the same reason.
                Backend `/api/device-tokens` stays: the web app still uses it. */}
            <NotificationBootstrap />
            {/* Realtime feed + badge via /hubs/notifications — replaces 30s polling. Must be mounted
                exactly once here: each mount opens its own WebSocket. */}
            <RootLayoutNav />
            <StatusBar style="dark" />
          </AuthProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
