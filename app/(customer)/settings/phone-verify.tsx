import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useSendPhoneOtp } from '../../../src/features/account/hooks/useSendPhoneOtp';
import { useVerifyPhoneOtp } from '../../../src/features/account/hooks/useVerifyPhoneOtp';
import { PhoneVerifyForm } from '../../../src/features/account/components/PhoneVerifyForm';
import { handleErrorApi } from '../../../src/lib/errors';
import { PhoneOtpInput } from '../../../src/features/account/schemas/phoneVerify.schema';

export default function PhoneVerifyScreen() {
  const sendOtp = useSendPhoneOtp();
  const verifyOtp = useVerifyPhoneOtp();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));

  // sendOtp — non-form → onError trực tiếp
  const handleSend = () => {
    sendOtp.mutate(undefined, {
      onError: (error) => handleErrorApi({ error }),
    });
  };

  // verifyOtp — có form → mutateAsync + try-catch + handleErrorApi
  const handleVerify = async (data: PhoneOtpInput) => {
    setFieldErrors({});
    try {
      await verifyOtp.mutateAsync(data);
      Alert.alert('Thành công', 'Số điện thoại đã được xác thực.');
    } catch (error) {
      handleErrorApi({ error, setFieldError });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PhoneVerifyForm
        onSendOtp={handleSend}
        onVerify={handleVerify}
        isSending={sendOtp.isPending}
        isVerifying={verifyOtp.isPending}
        fieldErrors={fieldErrors}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
});
