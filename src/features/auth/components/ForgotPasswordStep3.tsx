import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useResetPassword } from '../hooks/useResetPassword';
import { resetPasswordSchema } from '../schemas/resetPassword.schema';
import { HttpError, EntityError } from '@/src/lib/errors';
import { Colors } from '@/src/lib/theme';
import { PASSWORD_MIN_LENGTH } from '@/src/shared/schemas/common.schema';

interface Props {
  resetToken: string;
  expiresInSeconds: number;
  onExpired: () => void;
}

export function ForgotPasswordStep3({ resetToken, expiresInSeconds, onExpired }: Props) {
  const { mutateAsync, isPending } = useResetPassword();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      Alert.alert('Time expired', 'Your password reset session has expired. Please start over.', [
        { text: 'OK', onPress: onExpired },
      ]);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onExpired]);

  const getError = (field: string) => fieldErrors[field];

  const handleSubmit = async () => {
    setFieldErrors({});
    setGeneralError('');
    const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) errs[k] = v[0];
      });
      setFieldErrors(errs);
      return;
    }
    try {
      await mutateAsync({ resetToken, newPassword: result.data.newPassword });
    } catch (error) {
      if (error instanceof EntityError) {
        const errs: Record<string, string> = {};
        error.errors.forEach(({ field, detail }) => {
          errs[field.charAt(0).toLowerCase() + field.slice(1)] = detail;
        });
        setFieldErrors(errs);
      } else if (error instanceof HttpError) {
        setGeneralError(error.message);
      } else if (error instanceof Error) {
        setGeneralError('Unable to connect. Please check your network.');
      }
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <View style={styles.container}>
      {/* Session Timer Banner */}
      <View style={styles.timerBanner}>
        <Ionicons name="time-outline" size={16} color="#E0533C" />
        <Text style={styles.timerText}>
          Time remaining: <Text style={{ fontWeight: '700' }}>{minutes}:{String(seconds).padStart(2, '0')}</Text>
        </Text>
      </View>

      {/* New Password */}
      <View>
        <Text style={styles.label}>New password</Text>
        <View style={[
          styles.inputWrap,
          focusedField === 'newPassword' && styles.inputFocused,
          getError('newPassword') ? styles.inputError : null
        ]}>
          <TextInput
            style={styles.input}
            placeholder={`Minimum ${PASSWORD_MIN_LENGTH} characters`}
            placeholderTextColor={Colors.textFaint}
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
            onFocus={() => setFocusedField('newPassword')}
            onBlur={() => setFocusedField(null)}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textFaint} />
          </Pressable>
        </View>
        {getError('newPassword') ? <Text style={styles.errorText}>{getError('newPassword')}</Text> : null}
      </View>

      {/* Confirm Password */}
      <View>
        <Text style={styles.label}>Confirm new password</Text>
        <View style={[
          styles.inputWrap,
          focusedField === 'confirmPassword' && styles.inputFocused,
          getError('confirmPassword') ? styles.inputError : null
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Re-enter new password"
            placeholderTextColor={Colors.textFaint}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
          />
          <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={8}>
            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textFaint} />
          </Pressable>
        </View>
        {getError('confirmPassword') ? <Text style={styles.errorText}>{getError('confirmPassword')}</Text> : null}
      </View>

      {generalError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{generalError}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.button, (isPending || timeLeft <= 0) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isPending || timeLeft <= 0}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset password</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF2F0',
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  timerText: {
    color: '#E0533C',
    fontSize: 13,
    fontWeight: '500',
  },
  label: { fontSize: 14, fontWeight: '700', color: '#1A1A1C', marginBottom: 8, marginLeft: 16 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 54,
  },
  input: { flex: 1, fontSize: 15, color: '#1A1A1C', paddingVertical: 0 },
  inputFocused: { borderColor: '#34C759' },
  inputError: { borderColor: Colors.danger, backgroundColor: '#FFF5F5' },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: 4, marginLeft: 16 },
  button: {
    backgroundColor: '#34C759', borderRadius: 28,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
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
