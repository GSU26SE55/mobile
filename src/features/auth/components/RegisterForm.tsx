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

  const fields: {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (t: string) => void;
    keyboardType?: 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'words';
    secure?: boolean;
    optional?: boolean;
  }[] = [
    { key: 'fullName', label: 'Họ và tên', icon: 'person-outline', placeholder: 'Nguyễn Văn A', value: fullName, onChangeText: setFullName, autoCapitalize: 'words' },
    { key: 'email', label: 'Email', icon: 'mail-outline', placeholder: 'name@example.com', value: email, onChangeText: setEmail, keyboardType: 'email-address', autoCapitalize: 'none' },
    { key: 'password', label: 'Mật khẩu', icon: 'lock-closed-outline', placeholder: 'Tối thiểu 8 ký tự', value: password, onChangeText: setPassword, secure: true },
    { key: 'phoneNumber', label: 'Số điện thoại', icon: 'call-outline', placeholder: '0912345678', value: phoneNumber, onChangeText: setPhoneNumber, keyboardType: 'phone-pad', optional: true },
  ];

  return (
    <View style={styles.container}>
      {fields.map((f) => (
        <View key={f.key}>
          <Text style={styles.label}>
            {f.label}{f.optional ? '' : ' *'}
            {f.optional && <Text style={styles.optional}> (tuỳ chọn)</Text>}
          </Text>
          <View style={[styles.inputWrap, getError(f.key) && styles.inputError]}>
            <Ionicons name={f.icon} size={18} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              placeholderTextColor={Colors.placeholder}
              value={f.value}
              onChangeText={f.onChangeText}
              keyboardType={f.keyboardType}
              autoCapitalize={f.autoCapitalize}
              secureTextEntry={f.secure && !showPassword}
            />
            {f.secure && (
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textTertiary} />
              </Pressable>
            )}
          </View>
          {getError(f.key) ? <Text style={styles.errorText}>{getError(f.key)}</Text> : null}
        </View>
      ))}

      {generalError ? (
        <View style={CommonStyles.generalError}>
          <Text style={CommonStyles.generalErrorText}>{generalError}</Text>
        </View>
      ) : null}

      <Pressable style={[styles.button, isPending && styles.buttonDisabled]} onPress={handleSubmit} disabled={isPending}>
        {isPending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Đăng ký</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { gap: 14 },
  label:          { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  optional:       { color: Colors.textTertiary, fontWeight: '400' },
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
