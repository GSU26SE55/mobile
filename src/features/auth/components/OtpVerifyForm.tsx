import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, CommonStyles } from '../../../lib/theme';
import { HttpError, EntityError } from '../../../lib/errors';
import { useVerifyOtp } from '../hooks/useVerifyOtp';
import { useResendOtp } from '../hooks/useResendOtp';
import { otpSchema } from '../schemas/otp.schema';

interface Props { email: string; }

const RESEND_COOLDOWN = 60;

export function OtpVerifyForm({ email }: Props) {
  const { mutateAsync: verifyAsync, isPending: verifying } = useVerifyOtp();
  const resendMutation = useResendOtp();
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
      await verifyAsync({ email, otp: result.data.otp });
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
      <Text style={styles.hint}>
        Mã xác thực đã gửi đến{'\n'}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      <TextInput
        style={[styles.otpInput, otpError && styles.inputError]}
        placeholder="000000"
        placeholderTextColor={Colors.placeholder}
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />
      {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

      {generalError ? (
        <View style={CommonStyles.generalError}>
          <Text style={CommonStyles.generalErrorText}>{generalError}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.button, verifying && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={verifying}
      >
        {verifying ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Xác thực</Text>}
      </Pressable>

      <Pressable
        onPress={handleResend}
        disabled={countdown > 0 || resendMutation.isPending}
        style={styles.resendBtn}
      >
        <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
          {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại OTP'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { gap: 16 },
  hint:           { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { color: Colors.primary, fontWeight: '600' },
  otpInput:       {
    backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, padding: 16, fontSize: 28,
    textAlign: 'center', letterSpacing: 12, fontWeight: '700',
    color: Colors.text,
  },
  inputError:     { borderColor: Colors.danger, backgroundColor: '#FFF5F5' },
  errorText:      { color: Colors.danger, fontSize: 12, textAlign: 'center' },
  button:         { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: Colors.white, fontWeight: '600', fontSize: 16 },
  resendBtn:      { alignItems: 'center', paddingVertical: 8 },
  resendText:     { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  resendDisabled: { color: Colors.textTertiary },
});
