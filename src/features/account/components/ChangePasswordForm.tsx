import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, ShadowPrimary } from '../../../lib/theme';
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
      <Text style={styles.label}>Mat khau hien tai</Text>
      <TextInput
        style={[styles.input, getError('currentPassword') && styles.inputError]}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholderTextColor={Colors.textFaint}
      />
      {getError('currentPassword') ? <Text style={styles.error}>{getError('currentPassword')}</Text> : null}

      <Text style={styles.label}>Mat khau moi</Text>
      <TextInput
        style={[styles.input, getError('newPassword') && styles.inputError]}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholderTextColor={Colors.textFaint}
      />
      {getError('newPassword') ? <Text style={styles.error}>{getError('newPassword')}</Text> : null}

      <Text style={styles.label}>Xac nhan mat khau moi</Text>
      <TextInput
        style={[styles.input, getError('confirmPassword') && styles.inputError]}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor={Colors.textFaint}
      />
      {getError('confirmPassword') ? <Text style={styles.error}>{getError('confirmPassword')}</Text> : null}

      <Pressable style={[styles.button, isLoading && styles.btnDisabled]} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Doi mat khau</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { gap: 4 },
  label:      { fontSize: 12, fontWeight: '500', color: Colors.textMute, marginBottom: 6, marginTop: 14 },
  input:      {
    backgroundColor: Colors.card2, borderWidth: 1, borderColor: 'transparent',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.text,
  },
  inputError: { borderColor: Colors.danger },
  error:      { color: Colors.danger, fontSize: 12, marginTop: 4 },
  button:     {
    marginTop: 24, backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
    ...ShadowPrimary,
  },
  btnDisabled:{ opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
