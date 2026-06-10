import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadow } from '../../../lib/theme';
import { HoldReasonEnum } from '../types/staff.types';

const HOLD_OPTIONS: { value: HoldReasonEnum; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'WAITING_CUSTOMER',        label: 'Chờ khách phản hồi',     icon: 'person-outline' },
  { value: 'WAITING_PARTS',           label: 'Chờ linh kiện/phụ tùng', icon: 'construct-outline' },
  { value: 'WAITING_ONSITE_SCHEDULE', label: 'Chờ lịch on-site',       icon: 'calendar-outline' },
];

interface Props {
  visible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (reason: HoldReasonEnum) => void;
}

export function HoldModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<HoldReasonEnum | null>(null);

  const handleSubmit = () => {
    if (selected) onSubmit(selected);
  };

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, Shadow]}>
          <Text style={styles.title}>Tạm dừng ticket</Text>
          <Text style={styles.desc}>Chọn lý do tạm dừng. SLA sẽ được pause.</Text>

          <View style={styles.options}>
            {HOLD_OPTIONS.map((opt) => {
              const active = selected === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => setSelected(opt.value)}
                >
                  <Ionicons name={opt.icon} size={20} color={active ? Colors.primary : Colors.textMute} />
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </Pressable>
              );
            })}
          </View>

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
                <Text style={styles.submitText}>Xác nhận</Text>
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
    color: Colors.text,
  },
  desc: {
    fontSize: 13,
    color: Colors.textMute,
    fontWeight: '500',
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.card2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  optionLabelActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
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
    backgroundColor: Colors.warning,
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
