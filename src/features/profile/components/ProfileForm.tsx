import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, ShadowPrimary } from '@/src/lib/theme';
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
    // Gửi "" thay vì undefined: BE coi khoá vắng mặt là "giữ nguyên giá trị đang lưu"
    // (để client không render field thì không xoá nhầm được), nên muốn xoá phải nói rõ.
    // Form này có ô địa chỉ và ô số điện thoại, nên nó được quyền xoá cả hai.
    onSubmit({
      fullName: result.data.fullName,
      phoneNumber: result.data.phoneNumber ?? '',
      address: result.data.address ?? '',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Full name *</Text>
      <TextInput
        style={[styles.input, getError('fullName') && styles.inputError]}
        value={fullName}
        onChangeText={setFullName}
        placeholderTextColor={Colors.textFaint}
      />
      {getError('fullName') ? <Text style={styles.error}>{getError('fullName')}</Text> : null}

      <Text style={styles.label}>Phone number</Text>
      <TextInput
        style={[styles.input, getError('phoneNumber') && styles.inputError]}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholderTextColor={Colors.textFaint}
      />
      {getError('phoneNumber') ? <Text style={styles.error}>{getError('phoneNumber')}</Text> : null}

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[styles.input, styles.multiline, getError('address') && styles.inputError]}
        value={address}
        onChangeText={setAddress}
        multiline
        placeholderTextColor={Colors.textFaint}
      />
      {getError('address') ? <Text style={styles.error}>{getError('address')}</Text> : null}

      <Pressable style={[styles.button, isLoading && styles.btnDisabled]} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save changes</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { gap: 4 },
  label:       { fontSize: 12, fontWeight: '500', color: Colors.textMute, marginBottom: 6, marginTop: 14 },
  input:       {
    backgroundColor: Colors.card2, borderWidth: 1, borderColor: 'transparent',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.text,
  },
  inputError:  { borderColor: Colors.danger },
  multiline:   { minHeight: 80, textAlignVertical: 'top' },
  error:       { color: Colors.danger, fontSize: 12, marginTop: 4 },
  button:      {
    marginTop: 24, backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
    ...ShadowPrimary,
  },
  btnDisabled: { opacity: 0.45 },
  buttonText:  { color: '#fff', fontSize: 14, fontWeight: '600' },
});
