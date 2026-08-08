import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { BottomSheet } from '@/src/shared/components/BottomSheet';
import { PauseReasonEnum } from '@/src/features/tickets/types/ticket.types';

const HOLD_OPTIONS: { value: PauseReasonEnum; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: PauseReasonEnum.WaitingCustomer,       label: 'Waiting for customer reply', icon: 'person-outline' },
  { value: PauseReasonEnum.WaitingParts,          label: 'Waiting for parts/equipment', icon: 'construct-outline' },
  { value: PauseReasonEnum.WaitingOnsiteSchedule, label: 'Waiting for on-site schedule', icon: 'calendar-outline' },
];

interface Props {
  visible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (reason: PauseReasonEnum, note?: string) => void;
}

export function HoldModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<PauseReasonEnum | null>(null);
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
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.body}>
        <Text style={styles.title}>Hold ticket</Text>
        <Text style={styles.desc}>Select a hold reason. The SLA timer will be paused.</Text>

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

        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Note (optional)..."
          placeholderTextColor={Colors.textFaint}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />

        <View style={styles.actions}>
          <Pressable style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.submitBtn, !selected && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!selected || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>Confirm</Text>
            )}
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
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
  noteInput: {
    backgroundColor: Colors.card2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
    minHeight: 64,
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
