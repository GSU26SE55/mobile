import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/src/context/authContext';
import { PermissionsSync } from '@/src/features/auth/components/PermissionsSync';
import { NotificationBootstrap } from '@/src/features/notifications/components/NotificationBootstrap';
import { configureGoogleSignin } from '@/src/config/googleAuth';

// Import side-effect: TaskManager.defineTask phải chạy ở top-level, TRƯỚC khi React tree dựng.
// OS khởi động lại JS runtime để chạy background task khi app đã bị kill — lúc đó không có
// component nào cả, task phải đăng ký sẵn từ module scope.
import '@/src/features/notifications/lib/backgroundSync';

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
          {/* Quyền + kênh Android, SignalR realtime, background sync, badge.
              Thông báo tới qua SignalR rồi hiển thị bằng local notification — KHÔNG dùng
              Expo remote push, nên không đăng ký device token với BE (xem
              device-token.service.ts). PushResponseHandler của GH-83 đã gỡ theo. */}
          <NotificationBootstrap />
          <RootLayoutNav />
          <StatusBar style="dark" />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
