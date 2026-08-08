import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In — called once when the app boots (app/_layout.tsx).
// webClientId MUST be the "Web" OAuth client ID (not iOS/Android) so the idToken's `aud`
// matches what the BE validates against. Read from env, do NOT hardcode.
//
// Static import is intentional: a `require()` inside a function body is not a static
// dependency for Metro, so every hot-reload it runs again and re-registers the native view
// `RNGoogleSigninButton` → "Tried to register two views with the same name". The project
// runs a dev build (has ios/, plugin declared in app.json) so the native module is always
// available — no need to lazy-load.
export function configureGoogleSignin() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // iOS native needs its own client ID to start the flow
    offlineAccess: false, // only idToken is needed, no serverAuthCode
  });
}
