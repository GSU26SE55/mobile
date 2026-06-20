import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useChangeEmail } from '../../../src/features/account/hooks/useChangeEmail';
import { useConfirmEmailChange } from '../../../src/features/account/hooks/useConfirmEmailChange';
import { ChangeEmailForm } from '../../../src/features/account/components/ChangeEmailForm';
import { ConfirmEmailOtpForm } from '../../../src/features/account/components/ConfirmEmailOtpForm';
import { handleErrorApi } from '../../../src/lib/errors';
import { ChangeEmailInput, ConfirmEmailOtpInput } from '../../../src/features/account/schemas/changeEmail.schema';

export default function ChangeEmailScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  const changeEmail = useChangeEmail();
  const confirmChange = useConfirmEmailChange();

  const setFieldError = (setter: typeof setStep1Errors) => (field: string, msg: string) =>
    setter((prev) => ({ ...prev, [field]: msg }));

  // Step 1 — mutateAsync + try-catch + handleErrorApi (có form)
  const handleStep1 = async (data: ChangeEmailInput) => {
    setStep1Errors({});
    try {
      await changeEmail.mutateAsync(data);
      // chuyển step trong onSuccess của mutateAsync — tránh race condition
      setStep(2);
    } catch (error) {
      handleErrorApi({ error, setFieldError: setFieldError(setStep1Errors) });
    }
  };

  // Step 2 — mutateAsync + try-catch + handleErrorApi (có form)
  const handleStep2 = async (data: ConfirmEmailOtpInput) => {
    setStep2Errors({});
    try {
      await confirmChange.mutateAsync(data);
    } catch (error) {
      handleErrorApi({ error, setFieldError: setFieldError(setStep2Errors) });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.step}>Bước {step}/2</Text>

      {step === 1 ? (
        <ChangeEmailForm
          onSubmit={handleStep1}
          isLoading={changeEmail.isPending}
          fieldErrors={step1Errors}
        />
      ) : (
        <ConfirmEmailOtpForm
          onSubmit={handleStep2}
          isLoading={confirmChange.isPending}
          fieldErrors={step2Errors}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  step:      { fontSize: 13, color: '#6b7280', marginBottom: 16 },
});
