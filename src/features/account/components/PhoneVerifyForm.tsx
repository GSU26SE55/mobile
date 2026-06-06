import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCountdown } from '../../../hooks/useCountdown';
import { phoneOtpSchema, PhoneOtpInput } from '../schemas/phoneVerify.schema';

interface Props {
  onSendOtp: () => void;
  onVerify: (data: PhoneOtpInput) => void;
  isSending?: boolean;
  isVerifying?: boolean;
  fieldErrors?: Record<string, string>;
}

export function PhoneVerifyForm({
  onSendOtp,
  onVerify,
  isSending,
  isVerifying,
  fieldErrors,
}: Props) {
  const [otp, setOtp] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { remaining, isActive, start } = useCountdown(60);

  const getError = (field: string) => localErrors[field] ?? fieldErrors?.[field];

  const handleSend = () => {
    onSendOtp();
    start();
  };

  const handleVerify = () => {
    setLocalErrors({});
    const result = phoneOtpSchema.safeParse({ otp });
    if (!result.success) {
      const errs: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) errs[k] = v[0];
      });
      setLocalErrors(errs);
      return;
    }
    onVerify(result.data);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.sendButton, isActive && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={isSending || isActive}
      >
        {isSending ? (
          <ActivityIndicator color="#6366f1" />
        ) : (
          <Text style={styles.sendButtonText}>
            {isActive ? `Gửi lại sau ${remaining}s` : 'Gửi OTP qua SMS'}
          </Text>
        )}
      </Pressable>

      <Text style={styles.label}>Mã OTP (6 chữ số)</Text>
      <TextInput
        style={[styles.input, getError('otp') && styles.inputError]}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
      />
      {getError('otp') ? <Text style={styles.error}>{getError('otp')}</Text> : null}

      <Pressable style={styles.button} onPress={handleVerify} disabled={isVerifying}>
        {isVerifying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Xác thực SĐT</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { gap: 4 },
  sendButton:         {
    borderWidth: 1, borderColor: '#6366f1', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  sendButtonDisabled: { borderColor: '#d1d5db' },
  sendButtonText:     { color: '#6366f1', fontSize: 15, fontWeight: '500' },
  label:              { fontSize: 13, color: '#6b7280', marginBottom: 4, marginTop: 16 },
  input:              {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 18,
    letterSpacing: 6, textAlign: 'center',
  },
  inputError:         { borderColor: '#ef4444' },
  error:              { color: '#ef4444', fontSize: 12, marginTop: 4, textAlign: 'center' },
  button:             {
    marginTop: 24, backgroundColor: '#6366f1',
    borderRadius: 8, paddingVertical: 13, alignItems: 'center',
  },
  buttonText:         { color: '#fff', fontSize: 15, fontWeight: '600' },
});
