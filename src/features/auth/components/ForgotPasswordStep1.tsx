import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { loginSchema } from '../schemas/login.schema';
import { HttpError, EntityError } from '../../../lib/errors';

interface Props { onSuccess: (email: string) => void; }

export function ForgotPasswordStep1({ onSuccess }: Props) {
  const { mutateAsync, isPending } = useForgotPassword();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async () => {
    setEmailError('');
    setGeneralError('');
    const result = loginSchema.shape.email.safeParse(email.trim());
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? 'Email không hợp lệ');
      return;
    }
    try {
      await mutateAsync({ email: result.data });
      onSuccess(result.data);
    } catch (error) {
      if (error instanceof EntityError) {
        const emailMsg = error.payload.listErrors?.find(e => e.field.toLowerCase() === 'email')?.detail;
        if (emailMsg) setEmailError(emailMsg);
        else setGeneralError(error.message);
      } else if (error instanceof HttpError) {
        setGeneralError(error.message);
      } else if (error instanceof Error) {
        setGeneralError('Không thể kết nối. Kiểm tra lại mạng.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nhập email để nhận mã OTP đặt lại mật khẩu</Text>
      <TextInput style={[styles.input, emailError && styles.inputError]} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}
      <TouchableOpacity style={[styles.button, isPending && styles.buttonDisabled]} onPress={handleSubmit} disabled={isPending}>
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gửi OTP</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  label: { color: '#555', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 13 },
  generalError: { color: '#e53e3e', fontSize: 14, backgroundColor: '#fff5f5', borderRadius: 8, padding: 10, textAlign: 'center', borderWidth: 1, borderColor: '#fed7d7' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
