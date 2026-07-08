import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, ShadowPrimary } from '../../../lib/theme';
import { useCountdown } from '../../../hooks/useCountdown';
import { confirmEmailOtpSchema, ConfirmEmailOtpInput } from '../schemas/changeEmail.schema';

interface Props {
  onSubmit: (data: ConfirmEmailOtpInput) => void;
  isLoading?: boolean;
  fieldErrors?: Record<string, string>;
  expiresInSeconds?: number;
}

export function ConfirmEmailOtpForm({ onSubmit, isLoading, fieldErrors, expiresInSeconds = 300 }: Props) {
  const [otp, setOtp] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { remaining, isActive, start } = useCountdown(expiresInSeconds);

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
      <View style={styles.hintBox}>
        <Text style={styles.hintText}>
          OTP đã được gửi đến email mới của bạn.
          {isActive ? ` Hết hạn sau ${remaining}s.` : ' OTP đã hết hạn.'}
        </Text>
      </View>

      <Text style={styles.label}>Mã OTP (6 chữ số)</Text>
      <TextInput
        style={[styles.input, getError('otp') && styles.inputError]}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        placeholderTextColor={Colors.textFaint}
      />
      {getError('otp') ? <Text style={styles.error}>{getError('otp')}</Text> : null}

      <Pressable style={[styles.button, isLoading && styles.btnDisabled]} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác nhận</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { gap: 4 },
  hintBox:    { backgroundColor: Colors.infoLight, borderRadius: 12, padding: 12 },
  hintText:   { fontSize: 13, color: Colors.infoDark, lineHeight: 18 },
  label:      { fontSize: 12, fontWeight: '500', color: Colors.textMute, marginBottom: 6, marginTop: 14 },
  input:      {
    backgroundColor: Colors.card2, borderWidth: 1, borderColor: 'transparent',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 18, letterSpacing: 6, textAlign: 'center', color: Colors.text,
  },
  inputError: { borderColor: Colors.danger },
  error:      { color: Colors.danger, fontSize: 12, marginTop: 4, textAlign: 'center' },
  button:     {
    marginTop: 24, backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
    ...ShadowPrimary,
  },
  btnDisabled:{ opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
