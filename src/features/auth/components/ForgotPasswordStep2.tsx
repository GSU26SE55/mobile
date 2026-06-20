import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useVerifyResetOtp } from '../hooks/useVerifyResetOtp';
import { useResendResetOtp } from '../hooks/useResendResetOtp';
import { otpSchema } from '../schemas/otp.schema';
import { HttpError, EntityError } from '../../../lib/errors';

interface Props {
  email: string;
  onSuccess: (resetToken: string, expiresInSeconds: number) => void;
}

const RESEND_COOLDOWN = 60;

export function ForgotPasswordStep2({ email, onSuccess }: Props) {
  const { mutateAsync: verifyAsync, isPending: verifying } = useVerifyResetOtp();
  const resendMutation = useResendResetOtp();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    setOtpError('');
    setGeneralError('');
    const result = otpSchema.safeParse({ otp });
    if (!result.success) {
      setOtpError(result.error.flatten().fieldErrors.otp?.[0] ?? 'OTP không hợp lệ');
      return;
    }
    try {
      const res = await verifyAsync({ email, otp: result.data.otp });
      const data = res.data.data;
      if (!data) {
        setGeneralError('Phản hồi không hợp lệ từ server.');
        return;
      }
      onSuccess(data.resetToken, data.expiresInSeconds);
    } catch (error) {
      if (error instanceof EntityError) {
        const otpMsg = error.payload.listErrors?.find(e => e.field.toLowerCase() === 'otp')?.detail;
        if (otpMsg) setOtpError(otpMsg);
        else setGeneralError(error.message);
      } else if (error instanceof HttpError) {
        setGeneralError(error.message);
      } else if (error instanceof Error) {
        setGeneralError('Không thể kết nối. Kiểm tra lại mạng.');
      }
    }
  };

  const handleResend = () => {
    setCountdown(RESEND_COOLDOWN);
    resendMutation.mutate({ email });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Nhập mã OTP đã gửi đến {email}</Text>
      <TextInput style={[styles.input, otpError && styles.inputError]} placeholder="Mã OTP (6 chữ số)" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} />
      {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
      {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}
      <TouchableOpacity style={[styles.button, verifying && styles.buttonDisabled]} onPress={handleVerify} disabled={verifying}>
        {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác thực</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resendMutation.isPending} style={styles.resendBtn}>
        <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
          {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  hint: { color: '#555', fontSize: 14, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 20, textAlign: 'center', letterSpacing: 4 },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 13 },
  generalError: { color: '#e53e3e', fontSize: 14, backgroundColor: '#fff5f5', borderRadius: 8, padding: 10, textAlign: 'center', borderWidth: 1, borderColor: '#fed7d7' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  resendBtn: { alignItems: 'center', paddingVertical: 8 },
  resendText: { color: '#2563eb', fontSize: 14 },
  resendDisabled: { color: '#999' },
});
