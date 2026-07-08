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
import { useRegister } from '../hooks/useRegister';
import { registerSchema } from '../schemas/register.schema';

export function RegisterForm() {
  const { mutateAsync, isPending } = useRegister();
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const getError = (field: string) => fieldErrors[field];

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isNameValid = fullName.trim().length >= 2;
  const isPhoneValid = phoneNumber.trim().length >= 9;

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

  const fields: {
    key: string;
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (t: string) => void;
    keyboardType?: 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'words';
    secure?: boolean;
    optional?: boolean;
    isValid?: boolean;
  }[] = [
    { key: 'fullName', label: 'Họ và tên', placeholder: 'Nguyễn Văn A', value: fullName, onChangeText: setFullName, autoCapitalize: 'words', isValid: isNameValid },
    { key: 'email', label: 'Email', placeholder: 'name@example.com', value: email, onChangeText: setEmail, keyboardType: 'email-address', autoCapitalize: 'none', isValid: isEmailValid },
    { key: 'password', label: 'Mật khẩu', placeholder: 'Tối thiểu 8 ký tự', value: password, onChangeText: setPassword, secure: true },
    { key: 'phoneNumber', label: 'Số điện thoại', placeholder: '0912345678 (Tùy chọn)', value: phoneNumber, onChangeText: setPhoneNumber, keyboardType: 'phone-pad', optional: true, isValid: isPhoneValid },
  ];

  return (
    <View style={styles.container}>
      {fields.map((f) => (
        <View key={f.key}>
          <Text style={styles.label}>
            {f.label}{f.optional ? '' : ' *'}
          </Text>
          <View style={[
            styles.inputWrap, 
            focusedField === f.key && styles.inputFocused,
            getError(f.key) ? styles.inputError : null
          ]}>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              placeholderTextColor={Colors.placeholder}
              value={f.value}
              onChangeText={f.onChangeText}
              keyboardType={f.keyboardType}
              autoCapitalize={f.autoCapitalize}
              secureTextEntry={f.secure && !showPassword}
              onFocus={() => setFocusedField(f.key)}
              onBlur={() => setFocusedField(null)}
            />
            {f.secure && (
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textTertiary} />
              </Pressable>
            )}
            {!f.secure && f.value.length > 0 && f.isValid !== undefined && (
              <Ionicons 
                name={f.isValid ? 'checkmark-circle' : 'close-circle'} 
                size={20} 
                color={f.isValid ? '#34C759' : Colors.textTertiary} 
              />
            )}
          </View>
          {getError(f.key) ? <Text style={styles.errorText}>{getError(f.key)}</Text> : null}
        </View>
      ))}

      {generalError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorBannerText}>{generalError}</Text>
        </View>
      ) : null}

      <Pressable style={[styles.button, isPending && styles.buttonDisabled]} onPress={handleSubmit} disabled={isPending}>
        {isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Tạo tài khoản</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { gap: 10 },
  label:          { fontSize: 13, fontWeight: '700', color: '#1A1A1C', marginBottom: 4, marginLeft: 16 },
  inputWrap:      {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 24, paddingHorizontal: 18, height: 48,
  },
  input:          { flex: 1, fontSize: 14, color: '#1A1A1C', paddingVertical: 0 },
  inputFocused:   { borderColor: '#34C759' },
  inputError:     { borderColor: Colors.danger, backgroundColor: '#FFF5F5' },
  errorText:      { color: Colors.danger, fontSize: 11, marginTop: 2, marginLeft: 16 },
  button:         {
    backgroundColor: '#34C759', borderRadius: 24,
    height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: Colors.white, fontWeight: '700', fontSize: 15 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  errorBannerText: {
    color: Colors.dangerDark,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
