import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/src/context/authContext';
import { PermissionsSync } from '@/src/features/auth/components/PermissionsSync';
import { NotificationBootstrap } from '@/src/features/notifications/components/NotificationBootstrap';
import { NotificationsRealtimeSync } from '@/src/features/notifications/components/NotificationsRealtimeSync';
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
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PermissionsSync />
          {/* Permissions + Android channel, SignalR realtime, background sync, badge.
              Notifications arrive via SignalR and are shown via local notification — does NOT use
              Expo remote push, so no device token is registered with the BE (see
              device-token.service.ts). GH-83's PushResponseHandler was removed accordingly. */}
          <NotificationBootstrap />
          {/* Realtime feed + badge via /hubs/notifications — replaces 30s polling. Must be mounted
              exactly once here: each mount opens its own WebSocket. */}
          <NotificationsRealtimeSync />
          <RootLayoutNav />
          <StatusBar style="dark" />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
