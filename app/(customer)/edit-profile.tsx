import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useProfile } from '../../src/features/profile/hooks/useProfile';
import { useUpdateProfile } from '../../src/features/profile/hooks/useUpdateProfile';
import { useUploadAvatar } from '../../src/features/profile/hooks/useUploadAvatar';
import { AvatarPicker } from '../../src/features/profile/components/AvatarPicker';
import { ProfileForm } from '../../src/features/profile/components/ProfileForm';
import { handleErrorApi } from '../../src/lib/errors';
import { UpdateProfileInput } from '../../src/features/profile/schemas/profile.schema';

export default function EditProfileScreen() {
  const { data: account, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));

  if (isLoading || !account) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Form submit — mutateAsync + try-catch + handleErrorApi
  const handleSubmit = async (data: UpdateProfileInput) => {
    setFieldErrors({});
    try {
      await updateProfile.mutateAsync(data);
      Alert.alert('Thành công', 'Thông tin đã được cập nhật.');
      router.back();
    } catch (error) {
      handleErrorApi({ error, setFieldError });
    }
  };

  // Upload avatar — non-form → onError trực tiếp
  const handleAvatarPress = () => {
    uploadAvatar.mutate(undefined, {
      onError: (error) => handleErrorApi({ error }),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvatarPicker
        displayAvatarUrl={account.displayAvatarUrl}
        fullName={account.fullName}
        onPress={handleAvatarPress}
        isLoading={uploadAvatar.isPending}
      />
      <View style={styles.form}>
        <ProfileForm
          account={account}
          onSubmit={handleSubmit}
          isLoading={updateProfile.isPending}
          fieldErrors={fieldErrors}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 24 },
  form:      { marginTop: 24 },
});
