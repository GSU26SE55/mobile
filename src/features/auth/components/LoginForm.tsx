import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLogin } from '../hooks/useLogin';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const loginMutation = useLogin();

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email không hợp lệ';
    if (!password || password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, errors.email ? styles.inputError : null]}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

      <TextInput
        style={[styles.input, errors.password ? styles.inputError : null]}
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loginMutation.isPending && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Đăng nhập</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { gap: 12 },
  input:          { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  inputError:     { borderColor: '#e53e3e' },
  errorText:      { color: '#e53e3e', fontSize: 13 },
  button:         { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontWeight: '600', fontSize: 16 },
});
