import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { BottomSheet } from '@/src/shared/components/BottomSheet';
import { EscalationReasonEnum } from '@/src/features/tickets/types/ticket.types';
import { handleErrorApi } from '@/src/lib/errors';

const ESCALATION_OPTIONS: { value: EscalationReasonEnum; label: string }[] = [
  { value: 'SkillGap',          label: 'Beyond handling capability' },
  { value: 'PartsRequired',     label: 'Requires special equipment/parts' },
  { value: 'SafetyConcern',     label: 'Safety concern' },
  { value: 'CustomerComplaint', label: 'Customer complaint' },
];

interface Props {
  visible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (reason: EscalationReasonEnum, note?: string) => Promise<void>;
}

export function EscalateModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<EscalationReasonEnum | null>(null);
  const [note, setNote] = useState('');
  const [reasonError, setReasonError] = useState('');

  const handleSubmit = async () => {
    if (!selected) return;
    setReasonError('');
    try {
      await onSubmit(selected, note.trim() || undefined);
    } catch (error) {
      handleErrorApi({
        error,
        setFieldError: (field, message) => {
          if (field === 'reason') setReasonError(message);
        },
      });
    }
  };

  const handleClose = () => {
    setSelected(null);
    setNote('');
    setReasonError('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.body}>
        <Text style={styles.title}>Escalation request</Text>
        <Text style={styles.desc}>Manager will review and reassign to a higher-tier Staff.</Text>

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
        {reasonError ? <Text style={styles.errorText}>{reasonError}</Text> : null}

        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Additional note (optional)..."
          placeholderTextColor={Colors.textFaint}
          multiline
          maxLength={500}
          textAlignVertical="top"
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
              <Text style={styles.submitText}>Send request</Text>
            )}
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: -8,
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
