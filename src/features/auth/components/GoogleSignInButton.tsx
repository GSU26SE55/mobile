import React from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { Colors } from '../../../lib/theme';
import { HttpError } from '../../../lib/errors';
import { useGoogleLogin } from '../hooks/useGoogleLogin';

const GOOGLE_LOGO = require('../../../../assets/images/google.png');

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
      if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Lỗi', 'Thiết bị thiếu Google Play Services (cần bản có GMS).');
        return;
      }
      // Surface mã lỗi thật để chẩn đoán (VD DEVELOPER_ERROR = SHA-1/clientId chưa đăng ký).
      const code = isErrorWithCode(error) ? error.code : undefined;
      Alert.alert(
        'Lỗi đăng nhập Google',
        code
          ? `Mã lỗi: ${code}. Nếu là DEVELOPER_ERROR → SHA-1/OAuth client chưa đăng ký hoặc dev build cũ (build lại).`
          : 'Không thể đăng nhập bằng Google. Vui lòng thử lại.',
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
