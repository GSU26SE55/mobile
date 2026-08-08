import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { HttpError, EntityError } from '@/src/lib/errors';
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
  
  const inputRef = useRef<TextInput>(null);

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
      setOtpError(result.error.flatten().fieldErrors.otp?.[0] ?? 'Invalid OTP');
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
        setGeneralError('Unable to connect. Please check your network.');
      }
    }
  };

  const handleResend = () => {
    setCountdown(RESEND_COOLDOWN);
    resendMutation.mutate({ email });
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>

      {/* Hidden input to receive key presses */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        autoFocus
      />

      {/* Visual OTP Slots */}
      <Pressable style={styles.otpContainer} onPress={focusInput}>
        {Array(6).fill(0).map((_, index) => {
          const char = otp[index] || '';
          const isFocused = index === otp.length;
          return (
            <View
              key={index}
              style={[
                styles.otpSlot,
                isFocused && styles.otpSlotFocused,
                otpError ? styles.otpSlotError : null,
              ]}
            >
              <Text style={styles.otpText}>
                {char || (isFocused ? '|' : '-')}
              </Text>
            </View>
          );
        })}
      </Pressable>

      {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

      {generalError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{generalError}</Text>
        </View>
      ) : null}

      {/* Resend code */}
      <Pressable
        onPress={handleResend}
        disabled={countdown > 0 || resendMutation.isPending}
        style={styles.resendBtn}
      >
        {countdown > 0 ? (
          <Text style={styles.resendDisabled}>
            Resend code in <Text style={{ fontWeight: '700' }}>{countdown}s</Text>
          </Text>
        ) : (
          <Text style={styles.resendText}>
            Didn't receive the OTP? <Text style={styles.resendLink}>Resend code</Text>
          </Text>
        )}
      </Pressable>

      {/* Verify button */}
      <Pressable
        style={[styles.button, verifying && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={verifying}
      >
        {verifying ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Verify</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { gap: 16 },
  hint:           { color: '#7A7872', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { color: '#1A1A1C', fontWeight: '700' },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  otpSlot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  otpSlotFocused: {
    borderColor: '#34C759',
    backgroundColor: '#FFFFFF',
  },
  otpSlotError: {
    borderColor: Colors.danger,
    backgroundColor: '#FFF5F5',
  },
  otpText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1C',
  },
  errorText:      { color: Colors.danger, fontSize: 12, textAlign: 'center', marginTop: -8 },
  button:         {
    backgroundColor: '#34C759', borderRadius: 28,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: Colors.white, fontWeight: '700', fontSize: 16 },
  resendBtn:      { alignItems: 'center', paddingVertical: 8 },
  resendText:     { color: '#7A7872', fontSize: 14 },
  resendLink:     { color: '#E0533C', fontWeight: '700', textDecorationLine: 'underline' },
  resendDisabled: { color: '#B0AEA6', fontSize: 14 },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  errorBannerText: {
    color: Colors.dangerDark,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
