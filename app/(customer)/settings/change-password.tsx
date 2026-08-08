import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useChangePassword } from '@/src/features/account/hooks/useChangePassword';
import { ChangePasswordForm } from '@/src/features/account/components/ChangePasswordForm';
import { handleErrorApi } from '@/src/lib/errors';
import { ChangePasswordInput } from '@/src/features/account/schemas/changePassword.schema';

export default function ChangePasswordScreen() {
  const { mutateAsync, isPending } = useChangePassword();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));

  // Form submit — use mutateAsync + try-catch + handleErrorApi (same pattern as FE)
  const handleSubmit = async (data: ChangePasswordInput) => {
    setFieldErrors({});
    try {
      await mutateAsync(data);
    } catch (error) {
      handleErrorApi({ error, setFieldError });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ChangePasswordForm
        onSubmit={handleSubmit}
        isLoading={isPending}
        fieldErrors={fieldErrors}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
});
