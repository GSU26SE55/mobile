import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { loginSchema } from '../schemas/login.schema';
import { HttpError, EntityError } from '@/src/lib/errors';
import { Colors } from '@/src/lib/theme';

interface Props { onSuccess: (email: string) => void; }

export function ForgotPasswordStep1({ onSuccess }: Props) {
  const { mutateAsync, isPending } = useForgotPassword();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [focused, setFocused] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async () => {
    setEmailError('');
    setGeneralError('');
    const result = loginSchema.shape.email.safeParse(email.trim());
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? 'Invalid email');
      return;
    }
    try {
      await mutateAsync({ email: result.data });
      onSuccess(result.data);
    } catch (error) {
      if (error instanceof EntityError) {
        const emailMsg = error.payload.listErrors?.find(e => e.field.toLowerCase() === 'email')?.detail;
        if (emailMsg) setEmailError(emailMsg);
        else setGeneralError(error.message);
      } else if (error instanceof HttpError) {
        setGeneralError(error.message);
      } else if (error instanceof Error) {
        setGeneralError('Unable to connect. Please check your network.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Account email</Text>
      <View style={[
        styles.inputRow,
        focused && styles.inputRowFocused,
        emailError ? styles.inputRowError : null
      ]}>
        <TextInput
          style={styles.input}
          placeholder="name@example.com"
          placeholderTextColor={Colors.textFaint}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {email.length > 0 && (
          <Ionicons
            name={isEmailValid ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={isEmailValid ? '#34C759' : Colors.textFaint}
          />
        )}
      </View>
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      
      {generalError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{generalError}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.button, isPending && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP code</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  label: { fontSize: 14, fontWeight: '700', color: '#1A1A1C', marginBottom: 8, marginLeft: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 54,
  },
  inputRowFocused: {
    borderColor: '#34C759',
  },
  inputRowError: {
    borderColor: Colors.danger,
    backgroundColor: '#FFF5F5',
  },
  input: { flex: 1, fontSize: 15, color: '#1A1A1C', paddingVertical: 0 },
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
