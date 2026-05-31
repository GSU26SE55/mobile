import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface Props {
  secret: string;
  otpAuthUri: string;
  onDisable: () => void;
  isDisabling?: boolean;
}

export function TwoFASetup({ secret, otpAuthUri, onDisable, isDisabling }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ 2FA sẽ được enforce tại bước đăng nhập ở Sprint sau. Hiện tại bạn có thể thiết lập
          sẵn nhưng chưa được yêu cầu nhập mã khi đăng nhập.
        </Text>
      </View>

      <Text style={styles.instruction}>
        Quét mã QR bên dưới bằng Google Authenticator hoặc Authy trước khi rời màn hình.
      </Text>

      <View style={styles.qrContainer}>
        <QRCode value={otpAuthUri} size={200} />
      </View>

      <Text style={styles.secretLabel}>Hoặc nhập thủ công:</Text>
      <View style={styles.secretBox}>
        <Text style={styles.secretText} selectable>{secret}</Text>
      </View>

      <Pressable style={styles.disableButton} onPress={onDisable} disabled={isDisabling}>
        {isDisabling ? (
          <ActivityIndicator color="#ef4444" />
        ) : (
          <Text style={styles.disableText}>Tắt 2FA</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { padding: 20, gap: 16 },
  disclaimer:    {
    backgroundColor: '#fef3c7', borderRadius: 8, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#f59e0b',
  },
  disclaimerText: { fontSize: 13, color: '#92400e', lineHeight: 18 },
  instruction:   { fontSize: 14, color: '#374151', lineHeight: 20 },
  qrContainer:   { alignItems: 'center', paddingVertical: 16 },
  secretLabel:   { fontSize: 13, color: '#6b7280' },
  secretBox:     {
    backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12,
  },
  secretText:    { fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, color: '#1f2937' },
  disableButton: {
    marginTop: 8, borderWidth: 1, borderColor: '#ef4444',
    borderRadius: 8, paddingVertical: 12, alignItems: 'center',
  },
  disableText:   { color: '#ef4444', fontSize: 15, fontWeight: '500' },
});
