import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvatarPicker } from '../../src/features/profile/components/AvatarPicker';
import { ProfileForm } from '../../src/features/profile/components/ProfileForm';
import { useProfile } from '../../src/features/profile/hooks/useProfile';
import { useUpdateProfile } from '../../src/features/profile/hooks/useUpdateProfile';
import { useUploadAvatar } from '../../src/features/profile/hooks/useUploadAvatar';
import { UpdateProfileInput } from '../../src/features/profile/schemas/profile.schema';
import { handleErrorApi } from '../../src/lib/errors';
import { Colors, Shadow } from '../../src/lib/theme';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data: account, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));

  if (isLoading || !account) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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

  const handleAvatarPress = () => {
    uploadAvatar.mutate(undefined, {
      onError: (error) => handleErrorApi({ error }),
    });
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AvatarPicker
          displayAvatarUrl={account.displayAvatarUrl}
          fullName={account.fullName}
          onPress={handleAvatarPress}
          isLoading={uploadAvatar.isPending}
        />
        <View style={styles.formWrap}>
          <ProfileForm
            account={account}
            onSubmit={handleSubmit}
            isLoading={updateProfile.isPending}
            fieldErrors={fieldErrors}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bg },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  header:      {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingBottom: 12,
    backgroundColor: Colors.card, ...Shadow,
  },
  backBtn:     {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: Colors.card2,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  content:     { padding: 18, paddingBottom: 40 },
  formWrap:    { marginTop: 18 },
});
