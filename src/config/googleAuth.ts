import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Cấu hình Google Sign-In — gọi 1 lần khi app boot (app/_layout.tsx).
// webClientId PHẢI là "Web" OAuth client ID (không phải iOS/Android) để idToken có `aud`
// khớp cái BE validate. Đọc từ env, KHÔNG hardcode.
export function configureGoogleSignin() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // iOS native cần client ID riêng để khởi tạo flow
    offlineAccess: false, // chỉ cần idToken, không cần serverAuthCode
  });
}
