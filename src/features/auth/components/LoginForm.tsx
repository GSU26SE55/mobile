import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, CommonStyles, Spacing } from '../../../lib/theme';
import { HttpError, EntityError } from '../../../lib/errors';
import { useLogin } from '../hooks/useLogin';
import { loginSchema } from '../schemas/login.schema';

export function LoginForm() {
  const { mutateAsync, isPending } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async () => {
    setFieldErrors({});
    setGeneralError('');

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
        const errs: Record<string, string> = {};
        error.payload.listErrors?.forEach(({ field, detail }) => {
          const key = field.charAt(0).toLowerCase() + field.slice(1);
          errs[key] = detail;
        });
        setFieldErrors(errs);
      } else if (error instanceof HttpError) {
        setGeneralError(error.message);
      } else if (error instanceof Error) {
        setGeneralError('Không thể kết nối. Kiểm tra lại mạng.');
      }
    }
  };

  const getFieldError = (field: string) => fieldErrors[field];

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Email</Text>
        <View style={[styles.inputWrap, getFieldError('email') && styles.inputError]}>
          <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor={Colors.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        {getFieldError('email') ? (
          <Text style={styles.errorText}>{getFieldError('email')}</Text>
        ) : null}
      </View>

      <View>
        <Text style={styles.label}>Mật khẩu</Text>
        <View style={[styles.inputWrap, getFieldError('password') && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor={Colors.placeholder}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textTertiary}
            />
          </Pressable>
        </View>
        {getFieldError('password') ? (
          <Text style={styles.errorText}>{getFieldError('password')}</Text>
        ) : null}
      </View>

      {generalError ? (
        <View style={CommonStyles.generalError}>
          <Text style={CommonStyles.generalErrorText}>{generalError}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.button, isPending && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Đăng nhập</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { gap: 16 },
  label:          { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  inputWrap:      {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 12,
  },
  inputIcon:      { marginRight: 8 },
  input:          { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 13 },
  inputError:     { borderColor: Colors.danger, backgroundColor: '#FFF5F5' },
  errorText:      { color: Colors.danger, fontSize: 12, marginTop: 4 },
  button:         {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: Colors.white, fontWeight: '600', fontSize: 16 },
});
