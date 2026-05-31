import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AccountDto, UpdateProfilePayload } from '../types/profile.types';
import { updateProfileSchema } from '../schemas/profile.schema';

interface Props {
  account: AccountDto;
  onSubmit: (data: UpdateProfilePayload) => void;
  isLoading?: boolean;
  fieldErrors?: Record<string, string>;
}

export function ProfileForm({ account, onSubmit, isLoading, fieldErrors }: Props) {
  const [fullName, setFullName] = useState(account.fullName);
  const [phoneNumber, setPhoneNumber] = useState(account.phoneNumber ?? '');
  const [address, setAddress] = useState(account.profile?.address ?? '');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const getError = (field: string) => localErrors[field] ?? fieldErrors?.[field];

  const handleSubmit = () => {
    setLocalErrors({});
    const result = updateProfileSchema.safeParse({ fullName, phoneNumber, address });
    if (!result.success) {
      const errs: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) errs[k] = v[0];
      });
      setLocalErrors(errs);
      return;
    }
    onSubmit({
      fullName: result.data.fullName,
      phoneNumber: result.data.phoneNumber || undefined,
      address: result.data.address || undefined,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Họ và tên *</Text>
      <TextInput
        style={[styles.input, getError('fullName') && styles.inputError]}
        value={fullName}
        onChangeText={setFullName}
      />
      {getError('fullName') ? <Text style={styles.error}>{getError('fullName')}</Text> : null}

      <Text style={styles.label}>Số điện thoại</Text>
      <TextInput
        style={[styles.input, getError('phoneNumber') && styles.inputError]}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      {getError('phoneNumber') ? <Text style={styles.error}>{getError('phoneNumber')}</Text> : null}

      <Text style={styles.label}>Địa chỉ</Text>
      <TextInput
        style={[styles.input, styles.multiline, getError('address') && styles.inputError]}
        value={address}
        onChangeText={setAddress}
        multiline
      />
      {getError('address') ? <Text style={styles.error}>{getError('address')}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Lưu thay đổi</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { gap: 4 },
  label:       { fontSize: 13, color: '#6b7280', marginBottom: 4, marginTop: 12 },
  input:       {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
  },
  inputError:  { borderColor: '#ef4444' },
  multiline:   { minHeight: 80, textAlignVertical: 'top' },
  error:       { color: '#ef4444', fontSize: 12, marginTop: 4 },
  button:      {
    marginTop: 24, backgroundColor: '#6366f1',
    borderRadius: 8, paddingVertical: 13, alignItems: 'center',
  },
  buttonText:  { color: '#fff', fontSize: 15, fontWeight: '600' },
});
