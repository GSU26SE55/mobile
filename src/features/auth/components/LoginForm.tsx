import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/lib/theme';
import { HttpError, EntityError } from '@/src/lib/errors';
import { useLogin } from '../hooks/useLogin';
import { loginSchema } from '../schemas/login.schema';

export function LoginForm() {
  const router = useRouter();
  const { mutateAsync, isPending } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async () => {
    setFieldErrors({});
    setGeneralError('');

    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      const errs: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) errs[k] = v[0];
      });
      setFieldErrors(errs);
      return;
    }

    try {
      await mutateAsync(result.data);
    } catch (error) {
      if (error instanceof EntityError) {
        const errs: Record<string, string> = {};
        error.errors.forEach(({ field, detail }) => {
          const key = field.charAt(0).toLowerCase() + field.slice(1);
          errs[key] = detail;
        });
        setFieldErrors(errs);
      } else if (error instanceof HttpError) {
        setGeneralError(error.message);
      } else if (error instanceof Error) {
        setGeneralError('Unable to connect. Please check your network.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Email */}
      <View>
        <Text style={styles.label}>Email or username</Text>
        <View style={[
          styles.inputRow,
          emailFocused && styles.inputRowFocused,
          fieldErrors.email ? styles.inputRowError : null,
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Username or email"
            placeholderTextColor={Colors.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />
          {email.length > 0 && (
            <Ionicons
              name={isEmailValid ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={isEmailValid ? '#34C759' : Colors.textFaint}
            />
          )}
        </View>
        {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}
      </View>

      {/* Password */}
      <View>
        <Text style={styles.label}>Password</Text>
        <View style={[
          styles.inputRow,
          passwordFocused && styles.inputRowFocused,
          fieldErrors.password ? styles.inputRowError : null,
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={Colors.textFaint}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textFaint}
            />
          </Pressable>
        </View>
        {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}
      </View>

      {/* Forgot Password Link */}
      <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotBtn}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

      {/* General error */}
      {generalError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorBannerText}>{generalError}</Text>
        </View>
      ) : null}

      {/* Submit */}
      <Pressable
        style={({ pressed }) => [styles.button, isPending && styles.buttonDisabled, pressed && styles.buttonPressed]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1C',
    marginBottom: 8,
    marginLeft: 16,
  },

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

  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1C',
    paddingVertical: 0,
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A7872',
  },

  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 16,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: Colors.dangerDark,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  button: {
    backgroundColor: '#34C759',
    borderRadius: 28,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed:  { opacity: 0.85 },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
