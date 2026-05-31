import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { changePasswordSchema, ChangePasswordInput } from '../schemas/changePassword.schema';

interface Props {
  onSubmit: (data: ChangePasswordInput) => void;
  isLoading?: boolean;
  fieldErrors?: Record<string, string>;
}

export function ChangePasswordForm({ onSubmit, isLoading, fieldErrors }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const getError = (field: string) => localErrors[field] ?? fieldErrors?.[field];

  const handleSubmit = () => {
    setLocalErrors({});
    const result = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
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
      <Text style={styles.label}>Mật khẩu hiện tại</Text>
      <TextInput
        style={[styles.input, getError('currentPassword') && styles.inputError]}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
      />
      {getError('currentPassword') ? (
        <Text style={styles.error}>{getError('currentPassword')}</Text>
      ) : null}

      <Text style={styles.label}>Mật khẩu mới</Text>
      <TextInput
        style={[styles.input, getError('newPassword') && styles.inputError]}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      {getError('newPassword') ? (
        <Text style={styles.error}>{getError('newPassword')}</Text>
      ) : null}

      <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
      <TextInput
        style={[styles.input, getError('confirmPassword') && styles.inputError]}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {getError('confirmPassword') ? (
        <Text style={styles.error}>{getError('confirmPassword')}</Text>
      ) : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Đổi mật khẩu</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { gap: 4 },
  label:      { fontSize: 13, color: '#6b7280', marginBottom: 4, marginTop: 12 },
  input:      {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
  },
  inputError: { borderColor: '#ef4444' },
  error:      { color: '#ef4444', fontSize: 12, marginTop: 4 },
  button:     {
    marginTop: 24, backgroundColor: '#6366f1',
    borderRadius: 8, paddingVertical: 13, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
