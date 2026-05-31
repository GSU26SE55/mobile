import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCountdown } from '../../../hooks/useCountdown';
import { confirmEmailOtpSchema, ConfirmEmailOtpInput } from '../schemas/changeEmail.schema';

interface Props {
  onSubmit: (data: ConfirmEmailOtpInput) => void;
  isLoading?: boolean;
  fieldErrors?: Record<string, string>;
  expiresInSeconds?: number;
}

export function ConfirmEmailOtpForm({
  onSubmit,
  isLoading,
  fieldErrors,
  expiresInSeconds = 300,
}: Props) {
  const [otp, setOtp] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { remaining, isActive, start } = useCountdown(expiresInSeconds);

  // Bắt đầu đếm ngược ngay khi form mount — OTP đã được gửi ở bước trước
  useEffect(() => { start(expiresInSeconds); }, [expiresInSeconds, start]);

  const getError = (field: string) => localErrors[field] ?? fieldErrors?.[field];

  const handleSubmit = () => {
    setLocalErrors({});
    const result = confirmEmailOtpSchema.safeParse({ otp });
    if (!result.success) {
      const errs: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) errs[k] = v[0];
      });
      setLocalErrors(errs);
      return;
    }
    onSubmit(result.data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        OTP đã được gửi đến email mới của bạn.
        {isActive ? ` Hết hạn sau ${remaining}s.` : ' OTP đã hết hạn.'}
      </Text>

      <Text style={styles.label}>Mã OTP (6 chữ số)</Text>
      <TextInput
        style={[styles.input, getError('otp') && styles.inputError]}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
      />
      {getError('otp') ? <Text style={styles.error}>{getError('otp')}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Xác nhận</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { gap: 4 },
  hint:       { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  label:      { fontSize: 13, color: '#6b7280', marginBottom: 4, marginTop: 12 },
  input:      {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 18,
    letterSpacing: 6, textAlign: 'center',
  },
  inputError: { borderColor: '#ef4444' },
  error:      { color: '#ef4444', fontSize: 12, marginTop: 4, textAlign: 'center' },
  button:     {
    marginTop: 24, backgroundColor: '#6366f1',
    borderRadius: 8, paddingVertical: 13, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
