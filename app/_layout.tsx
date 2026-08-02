import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/src/context/authContext';
import { PermissionsSync } from '@/src/features/auth/components/PermissionsSync';
import { PushResponseHandler } from '@/src/features/notifications/components/PushResponseHandler';
import { configureGoogleSignin } from '@/src/config/googleAuth';

// Cấu hình Google Sign-In 1 lần khi app boot.
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

// Guard auth là KHAI BÁO (<Redirect> ở app/index.tsx + (customer)/(staff) layout).
// KHÔNG thêm router.replace() theo auth state ở đây: nó chạy trong effect nên bắn
// cùng commit với <Redirect>, hai lệnh điều hướng chồng nhau lúc hydrate xong làm
// Fabric crash `addViewAt: The specified child already has a parent`.
function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(staff)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PermissionsSync />
          {/* GH-83 — bấm push → PATCH /opened + deep-link. Không render gì, chỉ gắn listener. */}
          <PushResponseHandler />
          <RootLayoutNav />
          <StatusBar style="dark" />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
