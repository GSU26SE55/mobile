import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useResetPassword } from '../hooks/useResetPassword';
import { resetPasswordSchema } from '../schemas/resetPassword.schema';
import { HttpError, EntityError } from '../../../lib/errors';

interface Props {
  resetToken: string;
  expiresInSeconds: number;
  onExpired: () => void;
}

export function ForgotPasswordStep3({ resetToken, expiresInSeconds, onExpired }: Props) {
  const { mutateAsync, isPending } = useResetPassword();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      Alert.alert('Hết thời gian', 'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng bắt đầu lại.', [
        { text: 'OK', onPress: onExpired },
      ]);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onExpired]);

  const getError = (field: string) => fieldErrors[field];

  const handleSubmit = async () => {
    setFieldErrors({});
    setGeneralError('');
    const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) errs[k] = v[0];
      });
      setFieldErrors(errs);
      return;
    }
    try {
      await mutateAsync({ resetToken, newPassword: result.data.newPassword });
    } catch (error) {
      if (error instanceof EntityError) {
        const errs: Record<string, string> = {};
        error.payload.listErrors?.forEach(({ field, detail }) => {
          errs[field.charAt(0).toLowerCase() + field.slice(1)] = detail;
        });
        setFieldErrors(errs);
      } else if (error instanceof HttpError) {
        setGeneralError(error.message);
      } else if (error instanceof Error) {
        setGeneralError('Không thể kết nối. Kiểm tra lại mạng.');
      }
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>
        Thời gian còn lại: {minutes}:{String(seconds).padStart(2, '0')}
      </Text>
      <TextInput style={[styles.input, getError('newPassword') && styles.inputError]} placeholder="Mật khẩu mới" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
      {getError('newPassword') ? <Text style={styles.errorText}>{getError('newPassword')}</Text> : null}
      <TextInput style={[styles.input, getError('confirmPassword') && styles.inputError]} placeholder="Xác nhận mật khẩu mới" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
      {getError('confirmPassword') ? <Text style={styles.errorText}>{getError('confirmPassword')}</Text> : null}
      {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}
      <TouchableOpacity style={[styles.button, (isPending || timeLeft <= 0) && styles.buttonDisabled]} onPress={handleSubmit} disabled={isPending || timeLeft <= 0}>
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  timer: { color: '#e53e3e', fontSize: 14, textAlign: 'center', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 13 },
  generalError: { color: '#e53e3e', fontSize: 14, backgroundColor: '#fff5f5', borderRadius: 8, padding: 10, textAlign: 'center', borderWidth: 1, borderColor: '#fed7d7' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
