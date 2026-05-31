import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRegister } from '../hooks/useRegister';

export function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const registerMutation = useRegister();

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Họ tên không được để trống';
    if (!email.trim()) errs.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email không hợp lệ';
    if (!password || password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự';
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password))
      errs.password = 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt';
    if (phoneNumber && !/^(0[35789])[0-9]{8}$/.test(phoneNumber))
      errs.phoneNumber = 'Số điện thoại không hợp lệ';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    registerMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phoneNumber: phoneNumber || undefined,
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, errors.fullName ? styles.inputError : null]}
        placeholder="Họ và tên"
        value={fullName}
        onChangeText={setFullName}
      />
      {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

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

      <TextInput
        style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
        placeholder="Số điện thoại (tuỳ chọn)"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />
      {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}

      <TouchableOpacity
        style={[styles.button, registerMutation.isPending && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Đăng ký</Text>}
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
