import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRegister } from '../hooks/useRegister';
import { registerSchema } from '../schemas/register.schema';
import { HttpError, EntityError } from '../../../lib/errors';

export function RegisterForm() {
  const { mutateAsync, isPending } = useRegister();
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const getError = (field: string) => fieldErrors[field];

  const handleSubmit = async () => {
    setFieldErrors({});
    setGeneralError('');
    const result = registerSchema.safeParse({ fullName, email, password, phoneNumber });
    if (!result.success) {
      const errs: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) errs[k] = v[0];
      });
      setFieldErrors(errs);
      return;
    }
    try {
      await mutateAsync({
        fullName:    result.data.fullName,
        email:       result.data.email,
        password:    result.data.password,
        phoneNumber: result.data.phoneNumber || undefined,
      });
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

  return (
    <View style={styles.container}>
      <TextInput style={[styles.input, getError('fullName') && styles.inputError]} placeholder="Họ và tên" value={fullName} onChangeText={setFullName} />
      {getError('fullName') ? <Text style={styles.errorText}>{getError('fullName')}</Text> : null}
      <TextInput style={[styles.input, getError('email') && styles.inputError]} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      {getError('email') ? <Text style={styles.errorText}>{getError('email')}</Text> : null}
      <TextInput style={[styles.input, getError('password') && styles.inputError]} placeholder="Mật khẩu" secureTextEntry value={password} onChangeText={setPassword} />
      {getError('password') ? <Text style={styles.errorText}>{getError('password')}</Text> : null}
      <TextInput style={[styles.input, getError('phoneNumber') && styles.inputError]} placeholder="Số điện thoại (tuỳ chọn)" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
      {getError('phoneNumber') ? <Text style={styles.errorText}>{getError('phoneNumber')}</Text> : null}
      {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}
      <TouchableOpacity style={[styles.button, isPending && styles.buttonDisabled]} onPress={handleSubmit} disabled={isPending}>
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng ký</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 13 },
  generalError: { color: '#e53e3e', fontSize: 14, backgroundColor: '#fff5f5', borderRadius: 8, padding: 10, textAlign: 'center', borderWidth: 1, borderColor: '#fed7d7' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
