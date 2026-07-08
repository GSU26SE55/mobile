import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Shadow, ShadowPrimary } from '../../../lib/theme';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { ReopenPayload } from '../types/ticket.types';

interface Props {
  visible: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: ReopenPayload) => void;
}

export function ReopenModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = reason.trim();
    // BE required (TicketReopenCommand) — rỗng → 400. Chặn sớm ở client.
    if (!trimmed) {
      setError('Vui lòng nhập lý do reopen');
      return;
    }
    onSubmit({ reopenReason: trimmed });
  };

  // Reset state khi đóng để lần mở sau không giữ lý do/lỗi cũ.
  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Mở lại ticket</Text>
          <Pressable style={styles.closeBtn} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Đóng">
            <Ionicons name="close" size={16} color={Colors.text2} />
          </Pressable>
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="information-circle" size={16} color={Colors.warning} />
          <Text style={styles.warningText}>
            Mở lại khả dụng trong 7 ngày sau khi ticket được giải quyết. Mô tả vấn đề còn lại.
          </Text>
        </View>

        <Text style={styles.inputLabel}>Lý do mở lại *</Text>
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={(t) => { setReason(t); setError(''); }}
          placeholder="VD: Pin vẫn nóng vào buổi trưa..."
          placeholderTextColor={Colors.textFaint}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.submitBtn, isLoading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.submitText}>Mở lại ticket</Text>
          }
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body:        { gap: 14 },
  headerRow:   { flexDirection: 'row', alignItems: 'center' },
  title:       { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text },
  closeBtn:    {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: Colors.card, ...Shadow,
    alignItems: 'center', justifyContent: 'center',
  },
  warningBox:  {
    flexDirection: 'row', gap: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: 12, padding: 12,
  },
  warningText: { flex: 1, fontSize: 12, color: '#7F4513', lineHeight: 18 },
  inputLabel:  { fontSize: 12, fontWeight: '500', color: Colors.textMute },
  errorText:   { fontSize: 12, color: Colors.danger, marginTop: -6 },
  input:       {
    backgroundColor: Colors.card2,
    borderRadius: 12, padding: 13,
    fontSize: 14, color: Colors.text,
    textAlignVertical: 'top', minHeight: 80,
  },
  submitBtn:   {
    backgroundColor: Colors.primary, borderRadius: 14,
    padding: 13, alignItems: 'center',
    ...ShadowPrimary,
  },
  btnDisabled: { opacity: 0.45 },
  submitText:  { fontSize: 14, fontWeight: '600', color: '#fff' },
});
