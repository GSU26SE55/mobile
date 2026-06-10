import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, ShadowPrimary } from '../../../lib/theme';
import { changeEmailSchema, ChangeEmailInput } from '../schemas/changeEmail.schema';

interface Props {
  onSubmit: (data: ChangeEmailInput) => void;
  isLoading?: boolean;
  fieldErrors?: Record<string, string>;
}

export function ChangeEmailForm({ onSubmit, isLoading, fieldErrors }: Props) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const getError = (field: string) => localErrors[field] ?? fieldErrors?.[field];

  const handleSubmit = () => {
    setLocalErrors({});
    const result = changeEmailSchema.safeParse({ newEmail, currentPassword });
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
      <Text style={styles.label}>Email moi</Text>
      <TextInput
        style={[styles.input, getError('newEmail') && styles.inputError]}
        value={newEmail}
        onChangeText={setNewEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={Colors.textFaint}
      />
      {getError('newEmail') ? <Text style={styles.error}>{getError('newEmail')}</Text> : null}

      <Text style={styles.label}>Mat khau hien tai</Text>
      <TextInput
        style={[styles.input, getError('currentPassword') && styles.inputError]}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholderTextColor={Colors.textFaint}
      />
      {getError('currentPassword') ? <Text style={styles.error}>{getError('currentPassword')}</Text> : null}

      <Pressable style={[styles.button, isLoading && styles.btnDisabled]} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gui OTP xac nhan</Text>}
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
