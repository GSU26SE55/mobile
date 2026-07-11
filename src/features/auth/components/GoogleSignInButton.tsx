import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { Colors } from '../../../lib/theme';
import { HttpError } from '../../../lib/errors';
import { useGoogleLogin } from '../hooks/useGoogleLogin';

export function GoogleSignInButton() {
  const { mutateAsync, isPending } = useGoogleLogin();

  const handlePress = async () => {
    try {
      await GoogleSignin.hasPlayServices(); // Android: kiểm tra Google Play Services
      const response = await GoogleSignin.signIn();

      const idToken = response.data?.idToken;
      if (!idToken) {
        Alert.alert('Lỗi', 'Không lấy được idToken từ Google.');
        return;
      }

      // BE đổi idToken → JWT hệ thống; luồng post-login dùng chung handleLoginSuccess.
      await mutateAsync({ idToken });
    } catch (error) {
      // User hủy giữa chừng → im lặng, không báo lỗi.
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
        return; // đang có 1 lần signIn khác chạy
      }
      if (error instanceof HttpError) {
        // BE từ chối: email chưa confirm / account bị khóa / ngoài scope...
        Alert.alert('Đăng nhập thất bại', error.message);
        return;
      }
      Alert.alert('Lỗi', 'Không thể đăng nhập bằng Google. Vui lòng thử lại.');
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
          <Ionicons name="logo-google" size={18} color="#EA4335" />
          <Text style={styles.buttonText}>Đăng nhập với Google</Text>
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
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: '#1A1A1C',
    fontWeight: '700',
    fontSize: 15,
  },
});
