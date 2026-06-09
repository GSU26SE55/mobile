import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, ShadowPrimary } from '../../../lib/theme';
import { useCountdown } from '../../../hooks/useCountdown';
import { phoneOtpSchema, PhoneOtpInput } from '../schemas/phoneVerify.schema';

interface Props {
  onSendOtp: () => void;
  onVerify: (data: PhoneOtpInput) => void;
  isSending?: boolean;
  isVerifying?: boolean;
  fieldErrors?: Record<string, string>;
}

export function PhoneVerifyForm({ onSendOtp, onVerify, isSending, isVerifying, fieldErrors }: Props) {
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
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text style={[styles.sendButtonText, isActive && { color: Colors.textMute }]}>
            {isActive ? `Gui lai sau ${remaining}s` : 'Gui OTP qua SMS'}
          </Text>
        )}
      </Pressable>

      <Text style={styles.label}>Ma OTP (6 chu so)</Text>
      <TextInput
        style={[styles.input, getError('otp') && styles.inputError]}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        placeholderTextColor={Colors.textFaint}
      />
      {getError('otp') ? <Text style={styles.error}>{getError('otp')}</Text> : null}

      <Pressable style={[styles.button, isVerifying && styles.btnDisabled]} onPress={handleVerify} disabled={isVerifying}>
        {isVerifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xac thuc SDT</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { gap: 4 },
  sendButton:         {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14,
    paddingVertical: 12, alignItems: 'center',
  },
  sendButtonDisabled: { borderColor: Colors.card3 },
  sendButtonText:     { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  label:              { fontSize: 12, fontWeight: '500', color: Colors.textMute, marginBottom: 6, marginTop: 16 },
  input:              {
    backgroundColor: Colors.card2, borderWidth: 1, borderColor: 'transparent',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 18, letterSpacing: 6, textAlign: 'center', color: Colors.text,
  },
  inputError:         { borderColor: Colors.danger },
  error:              { color: Colors.danger, fontSize: 12, marginTop: 4, textAlign: 'center' },
  button:             {
    marginTop: 24, backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
    ...ShadowPrimary,
  },
  btnDisabled:        { opacity: 0.45 },
  buttonText:         { color: '#fff', fontSize: 14, fontWeight: '600' },
});
