import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Cấu hình Google Sign-In — gọi 1 lần khi app boot (app/_layout.tsx).
// webClientId PHẢI là "Web" OAuth client ID (không phải iOS/Android) để idToken có `aud`
// khớp cái BE validate. Đọc từ env, KHÔNG hardcode.
//
// Import TĨNH có chủ đích: `require()` trong thân hàm không phải dependency tĩnh của Metro,
// nên mỗi lần hot-reload nó chạy lại và đăng ký lại native view `RNGoogleSigninButton`
// → "Tried to register two views with the same name". Dự án chạy dev build (có ios/,
// plugin khai báo trong app.json) nên native module luôn có sẵn, không cần lazy-load.
export function configureGoogleSignin() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // iOS native cần client ID riêng để khởi tạo flow
    offlineAccess: false, // chỉ cần idToken, không cần serverAuthCode
  });
}
