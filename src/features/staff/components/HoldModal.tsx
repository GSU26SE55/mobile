import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { BottomSheet } from '@/src/shared/components/BottomSheet';
import { PauseReasonEnum } from '@/src/features/tickets/types/ticket.types';
import { handleErrorApi } from '@/src/lib/errors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatLocalSchedule } from '@/src/features/tickets/utils/scheduleTime';

const HOLD_OPTIONS: { value: PauseReasonEnum; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: PauseReasonEnum.CustomerUnavailable, label: 'Customer unavailable', icon: 'person-outline' },
  { value: PauseReasonEnum.WorkBlocked, label: 'Work blocked', icon: 'construct-outline' },
];

interface Props {
  visible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (reason: PauseReasonEnum, note: string, appointment: Date) => Promise<void>;
}

export function HoldModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<PauseReasonEnum | null>(null);
  const [note, setNote] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [appointment, setAppointment] = useState(() => new Date(Date.now() + 60 * 60_000));

  const handleSubmit = async () => {
    if (!selected) return;
    setReasonError('');
    try {
      if (appointment.getTime() <= Date.now()) {
        setReasonError('Appointment must be in the future');
        return;
      }
      await onSubmit(selected, note.trim(), appointment);
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
    setAppointment(new Date(Date.now() + 60 * 60_000));
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
        {reasonError ? <Text style={styles.errorText}>{reasonError}</Text> : null}

        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Required note..."
          placeholderTextColor={Colors.textFaint}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.desc}>New appointment: {formatLocalSchedule(appointment.toISOString())}</Text>
        <DateTimePicker
          value={appointment}
          mode="datetime"
          minimumDate={new Date(Date.now() + 60_000)}
          onChange={(_, value) => value && setAppointment(value)}
        />

        <View style={styles.actions}>
          <Pressable style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.submitBtn, (!selected || !note.trim()) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!selected || !note.trim() || isLoading}
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
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: -8,
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
