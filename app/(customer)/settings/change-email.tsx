import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useChangeEmail } from '@/src/features/account/hooks/useChangeEmail';
import { useConfirmEmailChange } from '@/src/features/account/hooks/useConfirmEmailChange';
import { ChangeEmailForm } from '@/src/features/account/components/ChangeEmailForm';
import { ConfirmEmailOtpForm } from '@/src/features/account/components/ConfirmEmailOtpForm';
import { handleErrorApi } from '@/src/lib/errors';
import { ChangeEmailInput, ConfirmEmailOtpInput } from '@/src/features/account/schemas/changeEmail.schema';
import { Colors } from '@/src/lib/theme';

export default function ChangeEmailScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  const changeEmail = useChangeEmail();
  const confirmChange = useConfirmEmailChange();

  const setFieldError = (setter: typeof setStep1Errors) => (field: string, msg: string) =>
    setter((prev) => ({ ...prev, [field]: msg }));

  // Step 1 — mutateAsync + try-catch + handleErrorApi (has form)
  const handleStep1 = async (data: ChangeEmailInput) => {
    setStep1Errors({});
    try {
      await changeEmail.mutateAsync(data);
      // step transition happens in mutateAsync's onSuccess — avoids race condition
      setStep(2);
    } catch (error) {
      handleErrorApi({ error, setFieldError: setFieldError(setStep1Errors) });
    }
  };

  // Step 2 — mutateAsync + try-catch + handleErrorApi (has form)
  const handleStep2 = async (data: ConfirmEmailOtpInput) => {
    setStep2Errors({});
    try {
      await confirmChange.mutateAsync(data);
    } catch (error) {
      handleErrorApi({ error, setFieldError: setFieldError(setStep2Errors) });
    }
  };

  // Go back to step 1 to enter a different email / resend OTP (avoids being stuck when OTP expires at step 2).
  const backToStep1 = () => {
    setStep(1);
    setStep2Errors({});
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.step}>Step {step}/2</Text>

      {step === 1 ? (
        <ChangeEmailForm
          onSubmit={handleStep1}
          isLoading={changeEmail.isPending}
          fieldErrors={step1Errors}
        />
      ) : (
        <>
          <ConfirmEmailOtpForm
            onSubmit={handleStep2}
            isLoading={confirmChange.isPending}
            fieldErrors={step2Errors}
          />
          <Pressable style={styles.backLink} onPress={backToStep1} accessibilityRole="button">
            <Ionicons name="chevron-back" size={16} color={Colors.primary} />
            <Text style={styles.backText}>Enter a different email</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  step:      { fontSize: 13, color: Colors.textMute, marginBottom: 16 },
  backLink:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 20 },
  backText:  { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
