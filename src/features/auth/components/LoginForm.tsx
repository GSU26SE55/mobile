import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLogin } from '../hooks/useLogin';
import { loginSchema } from '../schemas/login.schema';
import { HttpError, EntityError } from '../../../lib/errors';

export function LoginForm() {
  const { mutateAsync, isPending } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async () => {
    setFieldErrors({});
    setGeneralError('');

    // Zod client-side validation
    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      const errs: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) errs[k] = v[0];
      });
      setFieldErrors(errs);
      return;
    }

    try {
      await mutateAsync(result.data);
    } catch (error) {
      if (error instanceof EntityError) {
        // BE trả field-level errors (listErrors)
        const errs: Record<string, string> = {};
        error.payload.listErrors?.forEach(({ field, detail }) => {
          const key = field.charAt(0).toLowerCase() + field.slice(1);
          errs[key] = detail;
        });
        setFieldErrors(errs);
      } else if (error instanceof HttpError) {
        // BE trả lỗi chung (sai mật khẩu, tài khoản bị khoá...) — hiện inline
        setGeneralError(error.message);
      } else if (error instanceof Error) {
        setGeneralError('Không thể kết nối. Kiểm tra lại mạng.');
      }
    }
  };

  const getFieldError = (field: string) => fieldErrors[field];

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, getFieldError('email') && styles.inputError]}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {getFieldError('email') ? (
        <Text style={styles.errorText}>{getFieldError('email')}</Text>
      ) : null}

      <TextInput
        style={[styles.input, getFieldError('password') && styles.inputError]}
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {getFieldError('password') ? (
        <Text style={styles.errorText}>{getFieldError('password')}</Text>
      ) : null}

      {/* Lỗi chung từ BE (sai thông tin, bị khoá...) — hiện dưới form, không phải Alert */}
      {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isPending && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Đăng nhập</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { gap: 12 },
  input:        { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  inputError:   { borderColor: '#e53e3e' },
  errorText:    { color: '#e53e3e', fontSize: 13 },
  generalError: {
    color: '#e53e3e', fontSize: 14,
    backgroundColor: '#fff5f5', borderRadius: 8,
    padding: 10, textAlign: 'center',
    borderWidth: 1, borderColor: '#fed7d7',
  },
  button:         { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontWeight: '600', fontSize: 16 },
});
