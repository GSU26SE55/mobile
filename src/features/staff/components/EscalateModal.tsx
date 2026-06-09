import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Shadow } from '../../../lib/theme';
import { EscalationReasonEnum } from '../../tickets/types/ticket.types';

const ESCALATION_OPTIONS: { value: EscalationReasonEnum; label: string }[] = [
  { value: 'SkillGap',          label: 'Vượt quá năng lực xử lý' },
  { value: 'PartsRequired',     label: 'Cần thiết bị/linh kiện đặc biệt' },
  { value: 'SafetyConcern',     label: 'Vấn đề an toàn' },
  { value: 'CustomerComplaint', label: 'Khách hàng phàn nàn' },
];

interface Props {
  visible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (reason: EscalationReasonEnum, note?: string) => void;
}

export function EscalateModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<EscalationReasonEnum | null>(null);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (selected) onSubmit(selected, note.trim() || undefined);
  };

  const handleClose = () => {
    setSelected(null);
    setNote('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, Shadow]}>
          <Text style={styles.title}>Yêu cầu escalate</Text>
          <Text style={styles.desc}>Manager sẽ xem xét và reassign cho Staff cấp cao hơn.</Text>

          <View style={styles.options}>
            {ESCALATION_OPTIONS.map((opt) => {
              const active = selected === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => setSelected(opt.value)}
                >
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={Colors.danger} />}
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Ghi chú thêm (tùy chọn)..."
            placeholderTextColor={Colors.textFaint}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, !selected && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!selected || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Gửi yêu cầu</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.danger,
  },
  desc: {
    fontSize: 13,
    color: Colors.textMute,
    fontWeight: '500',
  },
  options: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.card2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  optionLabelActive: {
    color: Colors.dangerDark,
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: Colors.card2,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.card2,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.danger,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
