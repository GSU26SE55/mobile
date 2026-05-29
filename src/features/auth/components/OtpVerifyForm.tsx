import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useVerifyOtp } from '../hooks/useVerifyOtp';
import { useResendOtp } from '../hooks/useResendOtp';

interface Props {
  email: string;
}

const RESEND_COOLDOWN = 60;

export function OtpVerifyForm({ email }: Props) {
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const verifyMutation = useVerifyOtp();
  const resendMutation = useResendOtp();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = () => {
    if (!otp || otp.length !== 6) { setOtpError('OTP phải đúng 6 chữ số'); return; }
    if (!/^\d{6}$/.test(otp)) { setOtpError('OTP chỉ gồm chữ số'); return; }
    setOtpError('');
    verifyMutation.mutate({ email, otp });
  };

  const handleResend = () => {
    setCountdown(RESEND_COOLDOWN);
    resendMutation.mutate({ email });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Nhập mã OTP đã gửi đến {email}</Text>

      <TextInput
        style={[styles.input, otpError ? styles.inputError : null]}
        placeholder="Mã OTP (6 chữ số)"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />
      {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

      <TouchableOpacity
        style={[styles.button, verifyMutation.isPending && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={verifyMutation.isPending}
      >
        {verifyMutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Xác thực</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleResend}
        disabled={countdown > 0 || resendMutation.isPending}
        style={styles.resendBtn}
      >
        <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
          {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { gap: 12 },
  hint:            { color: '#555', fontSize: 14, textAlign: 'center' },
  input:           { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 20, textAlign: 'center', letterSpacing: 4 },
  inputError:      { borderColor: '#e53e3e' },
  errorText:       { color: '#e53e3e', fontSize: 13 },
  button:          { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled:  { opacity: 0.6 },
  buttonText:      { color: '#fff', fontWeight: '600', fontSize: 16 },
  resendBtn:       { alignItems: 'center', paddingVertical: 8 },
  resendText:      { color: '#2563eb', fontSize: 14 },
  resendDisabled:  { color: '#999' },
});
