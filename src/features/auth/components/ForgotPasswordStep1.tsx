import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useForgotPassword } from '../hooks/useForgotPassword';

interface Props {
  onSuccess: (email: string) => void;
}

export function ForgotPasswordStep1({ onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const mutation = useForgotPassword();

  const handleSubmit = () => {
    if (!email.trim()) { setEmailError('Email không được để trống'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Email không hợp lệ'); return; }
    setEmailError('');
    mutation.mutate(
      { email: email.trim() },
      { onSuccess: (res) => { if (res.data.isSuccess) onSuccess(email.trim()); } },
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nhập email để nhận mã OTP đặt lại mật khẩu</Text>

      <TextInput
        style={[styles.input, emailError ? styles.inputError : null]}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      <TouchableOpacity
        style={[styles.button, mutation.isPending && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={mutation.isPending}
      >
        {mutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Gửi OTP</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { gap: 12 },
  label:          { color: '#555', fontSize: 14 },
  input:          { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  inputError:     { borderColor: '#e53e3e' },
  errorText:      { color: '#e53e3e', fontSize: 13 },
  button:         { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontWeight: '600', fontSize: 16 },
});
