import { NativeModules, TurboModuleRegistry } from 'react-native';

/**
 * Kiểm tra xem TurboModule / NativeModule RNGoogleSignin có tồn tại trong binary hay không.
 * Trong Expo Go, module này không được tích hợp nên TurboModuleRegistry.getEnforcing() sẽ throw error.
 */
export function isGoogleSigninSupported(): boolean {
  try {
    const hasTurboModule = Boolean(TurboModuleRegistry.get?.('RNGoogleSignin'));
    const hasNativeModule = Boolean(NativeModules.RNGoogleSignin);
    return hasTurboModule || hasNativeModule;
  } catch {
    return false;
  }
}

// Cấu hình Google Sign-In — gọi 1 lần khi app boot (app/_layout.tsx).
// webClientId PHẢI là "Web" OAuth client ID (không phải iOS/Android) để idToken có `aud`
// khớp cái BE validate. Đọc từ env, KHÔNG hardcode.
export function configureGoogleSignin() {
  if (!isGoogleSigninSupported()) {
    console.warn('[GoogleSignin] Native module RNGoogleSignin không khả dụng trong build này (ví dụ: Expo Go). Google Sign-In sẽ bị vô hiệu hóa.');
    return;
  }

  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // iOS native cần client ID riêng để khởi tạo flow
      offlineAccess: false, // chỉ cần idToken, không cần serverAuthCode
    });
  } catch (error) {
    console.warn('[GoogleSignin] Không thể cấu hình Google Sign-In:', error);
  }
}

