import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Shadow, ShadowPrimary } from '../../../lib/theme';
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
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Reopen ticket</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color={Colors.text2} />
            </Pressable>
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={16} color={Colors.warning} />
            <Text style={styles.warningText}>
              Reopen kha dung trong 7 ngay sau RESOLVED. Mo ta van de con lai.
            </Text>
          </View>

          <Text style={styles.inputLabel}>Ly do reopen *</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="VD: Pin van nong vao buoi trua..."
            placeholderTextColor={Colors.textFaint}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <Pressable
            style={[styles.submitBtn, isLoading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitText}>Reopen ticket</Text>
            }
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet:       {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 18, paddingBottom: 22,
    gap: 14,
  },
  handle:      {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.card3, alignSelf: 'center',
    marginTop: 8, marginBottom: 4,
  },
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
