import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ReopenPayload } from '../types/ticket.types';

interface Props {
  visible: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: ReopenPayload) => void;
}

export function ReopenModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onSubmit({ reopenReason: reason.trim() || undefined });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Yêu cầu xử lý lại</Text>
          <Text style={styles.desc}>Ticket sẽ được mở lại để xử lý. Bạn có thể cho biết lý do không hài lòng.</Text>

          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Lý do (tuỳ chọn)"
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Huỷ</Text>
            </Pressable>
            <Pressable style={[styles.submit, isLoading && styles.btnDisabled]} onPress={handleSubmit} disabled={isLoading}>
              {isLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitText}>Xác nhận</Text>
              }
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 16 },
  title:      { fontSize: 18, fontWeight: '700', color: '#111' },
  desc:       { fontSize: 13, color: '#666', lineHeight: 20 },
  input:      { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 14, textAlignVertical: 'top', minHeight: 80 },
  actions:    { flexDirection: 'row', gap: 12 },
  cancel:     { flex: 1, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  cancelText: { fontSize: 14, color: '#555' },
  submit:     { flex: 1, padding: 13, borderRadius: 10, backgroundColor: '#E53935', alignItems: 'center' },
  btnDisabled:{ opacity: 0.6 },
  submitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
