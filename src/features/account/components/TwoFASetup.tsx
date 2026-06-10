import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../../lib/theme';

interface Props {
  secret: string;
  otpAuthUri: string;
  onDisable: () => void;
  isDisabling?: boolean;
}

export function TwoFASetup({ secret, otpAuthUri, onDisable, isDisabling }: Props) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Lớp bảo mật 2FA sẽ được áp dụng cho tài khoản của bạn. Vui lòng quét mã QR hoặc lưu khóa bí mật trước khi rời màn hình.
        </Text>
      </View>

      <Text style={styles.instruction}>
        Quét mã QR bên dưới bằng Google Authenticator hoặc Authy:
      </Text>

      <View style={styles.qrContainer}>
        <QRCode value={otpAuthUri} size={200} />
      </View>

      <Text style={styles.secretLabel}>Hoặc tự nhập mã thủ công:</Text>
      <View style={styles.secretBox}>
        <Text style={styles.secretText} selectable>{secret}</Text>
      </View>

      <Pressable style={styles.disableButton} onPress={onDisable} disabled={isDisabling}>
        {isDisabling ? (
          <ActivityIndicator color={Colors.danger} />
        ) : (
          <Text style={styles.disableText}>Hủy thiết lập / Quay lại</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  container:      { padding: 24, gap: 16 },
  disclaimer:     {
    backgroundColor: Colors.warningLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255, 149, 0, 0.25)',
  },
  disclaimerText: { fontSize: 13, color: Colors.warningDark, lineHeight: 18 },
  instruction:    { fontSize: 14, color: Colors.text2, lineHeight: 20, marginTop: 4 },
  qrContainer:    { alignItems: 'center', paddingVertical: 16 },
  secretLabel:    { fontSize: 12, color: Colors.textMute, marginTop: 8 },
  secretBox:      { backgroundColor: Colors.card2, borderRadius: 12, padding: 12 },
  secretText:     { fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, color: Colors.text },
  disableButton:  {
    borderWidth: 1.5, borderColor: Colors.danger,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12,
  },
  disableText:    { color: Colors.danger, fontSize: 14, fontWeight: '600' },
});
