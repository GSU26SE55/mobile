import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useResetPassword } from '../hooks/useResetPassword';

interface Props {
  resetToken: string;
  expiresInSeconds: number;
  onExpired: () => void;
}

export function ForgotPasswordStep3({ resetToken, expiresInSeconds, onExpired }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds);
  const resetMutation = useResetPassword();

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

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!newPassword || newPassword.length < 8) errs.newPassword = 'Mật khẩu tối thiểu 8 ký tự';
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/.test(newPassword))
      errs.newPassword = 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    resetMutation.mutate({ resetToken, newPassword });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>
        Thời gian còn lại: {minutes}:{String(seconds).padStart(2, '0')}
      </Text>

      <TextInput
        style={[styles.input, errors.newPassword ? styles.inputError : null]}
        placeholder="Mật khẩu mới"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}

      <TextInput
        style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
        placeholder="Xác nhận mật khẩu mới"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (resetMutation.isPending || timeLeft <= 0) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={resetMutation.isPending || timeLeft <= 0}
      >
        {resetMutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { gap: 12 },
  timer:          { color: '#e53e3e', fontSize: 14, textAlign: 'center', fontWeight: '500' },
  input:          { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  inputError:     { borderColor: '#e53e3e' },
  errorText:      { color: '#e53e3e', fontSize: 13 },
  button:         { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontWeight: '600', fontSize: 16 },
});
