import React from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { HttpError } from '@/src/lib/errors';
import { Colors } from '@/src/lib/theme';
import { useGoogleLogin } from '../hooks/useGoogleLogin';

const GOOGLE_LOGO = require('../../../../assets/images/google.png');

export function GoogleSignInButton() {
  const { mutateAsync, isPending } = useGoogleLogin();

  const handlePress = async () => {
    try {
      await GoogleSignin.hasPlayServices(); // Android: check Google Play Services
      const response = await GoogleSignin.signIn();

      const idToken = response.data?.idToken;
      if (!idToken) {
        Alert.alert('Error', 'Could not get idToken from Google.');
        return;
      }

      // BE exchanges idToken → system JWT; post-login flow shares handleLoginSuccess.
      await mutateAsync({ idToken });
    } catch (error) {
      // User cancelled midway → fail silently, no error shown.
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
        return; // another signIn is already in progress
      }
      if (error instanceof HttpError) {
        // BE rejected: email not confirmed / account locked / out of scope...
        Alert.alert('Sign-in failed', error.message);
        return;
      }
      if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'This device is missing Google Play Services (a GMS build is required).');
        return;
      }
      // Surface the real error code for diagnosis (e.g. DEVELOPER_ERROR = SHA-1/clientId not registered).
      const code = isErrorWithCode(error) ? error.code : undefined;
      Alert.alert(
        'Google sign-in error',
        code
          ? `Error code: ${code}. If DEVELOPER_ERROR → SHA-1/OAuth client not registered or dev build is outdated (rebuild).`
          : 'Could not sign in with Google. Please try again.',
      );
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.button, isPending && styles.buttonDisabled, pressed && styles.buttonPressed]}
      onPress={handlePress}
      disabled={isPending}
    >
      {isPending ? (
        <ActivityIndicator color={Colors.text} />
      ) : (
        <>
          <Image source={GOOGLE_LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 28,
    height: 54,
  },
  logo: {
    width: 20,
    height: 20,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: '#1A1A1C',
    fontWeight: '700',
    fontSize: 15,
  },
});
