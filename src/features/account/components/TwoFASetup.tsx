import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/src/lib/theme';

interface Props {
  secret: string;
  otpAuthUri: string;
  onConfirm: (code: string) => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

// GH-295: enroll step 2 — scan QR then enter the 6-digit code to activate
export function TwoFASetup({ secret, otpAuthUri, onConfirm, onCancel, isConfirming }: Props) {
  const [code, setCode] = useState('');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Scan the QR code (or enter the secret key manually) with Google Authenticator / Authy, then enter the 6-digit code to enable 2FA.
        </Text>
      </View>

      <View style={styles.qrContainer}>
        <QRCode value={otpAuthUri} size={200} />
      </View>

      <Text style={styles.secretLabel}>Or enter the code manually:</Text>
      <View style={styles.secretBox}>
        <Text style={styles.secretText} selectable>{secret}</Text>
      </View>

      <Text style={styles.secretLabel}>TOTP code (6 digits):</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholder="123456"
        placeholderTextColor={Colors.textMute}
        value={code}
        maxLength={6}
        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
      />

      <Pressable
        style={[styles.confirmButton, code.length !== 6 && styles.confirmDisabled]}
        onPress={() => onConfirm(code)}
        disabled={isConfirming || code.length !== 6}
      >
        {isConfirming ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmText}>Confirm enable 2FA</Text>
        )}
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={onCancel} disabled={isConfirming}>
        <Text style={styles.cancelText}>Cancel / Go back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  container:      { padding: 24, gap: 14 },
  disclaimer:     {
    backgroundColor: Colors.warningLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255, 149, 0, 0.25)',
  },
  disclaimerText: { fontSize: 13, color: Colors.warningDark, lineHeight: 18 },
  qrContainer:    { alignItems: 'center', paddingVertical: 12 },
  secretLabel:    { fontSize: 12, color: Colors.textMute, marginTop: 4 },
  secretBox:      { backgroundColor: Colors.card2, borderRadius: 12, padding: 12 },
  secretText:     { fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, color: Colors.text },
  input:          {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16, fontSize: 18,
    letterSpacing: 4, textAlign: 'center', color: Colors.text,
  },
  confirmButton:  {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  confirmDisabled:{ opacity: 0.5 },
  confirmText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelButton:   {
    borderWidth: 1.5, borderColor: Colors.danger,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  cancelText:     { color: Colors.danger, fontSize: 14, fontWeight: '600' },
});
