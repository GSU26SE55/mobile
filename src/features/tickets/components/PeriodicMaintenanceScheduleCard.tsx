import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '@/src/lib/theme';
import { formatDateTime } from '@/src/lib/date';
import { handleErrorApi } from '@/src/lib/errors';
import { useSchedulePeriodicMaintenance } from '../hooks/useSchedulePeriodicMaintenance';
import {
  canCustomerSchedule,
  daysLeftToSchedule,
  rejectionMessage,
  validateChosenTime,
} from '../utils/periodicMaintenanceSchedule';
import type { TicketDetailDTO } from '../types/ticket.types';

/**
 * Ô để khách chọn giờ cho chuyến bảo trì định kỳ của mình.
 *
 * Chỉ hiện khi ticket còn nhận được lựa chọn — xem `canCustomerSchedule`. Hết cửa sổ thì ô
 * này biến mất và Manager tự sắp lịch; worker nhắc lịch bên TicketService đã bàn việc cho
 * Manager sau ba mốc khách không trả lời.
 *
 * Giờ đã chốt hiển thị ở `PendingContextCard`, không lặp lại ở đây.
 */
export function PeriodicMaintenanceScheduleCard({ ticket }: { ticket: TicketDetailDTO }) {
  const [chosen, setChosen] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const { mutateAsync, isPending } = useSchedulePeriodicMaintenance(ticket.id);

  if (!canCustomerSchedule(ticket)) return null;

  const deadline = ticket.periodicMaintenanceScheduleDeadlineAtUtc;
  const daysLeft = daysLeftToSchedule(deadline);

  const openPicker = () => {
    // Mở sẵn ở ngày mai để lựa chọn đầu tiên đã là một giờ hợp lệ — mở ở "bây giờ" thì lần
    // xác nhận đầu tiên luôn rơi vào quá khứ và bị từ chối.
    if (!chosen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setChosen(tomorrow);
    }
    setPickerMode('date');
  };

  const onPickerChange = (event: DateTimePickerEvent, value?: Date) => {
    if (event.type === 'dismissed') {
      setPickerMode(null);
      return;
    }
    if (!value) return;

    if (pickerMode === 'date') {
      const next = new Date(chosen ?? value);
      next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
      setChosen(next);
      // Chọn ngày xong chuyển sang chọn giờ: một chuyến bảo trì cần cả hai, tách làm hai lần
      // bấm riêng thì khách dễ quên bước thứ hai.
      setPickerMode('time');
      return;
    }

    const next = new Date(chosen ?? value);
    next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    setChosen(next);
    setPickerMode(null);
  };

  const submit = async () => {
    if (!chosen) return;

    const rejection = validateChosenTime(chosen, deadline);
    if (rejection) {
      Alert.alert('Cannot use this time', rejectionMessage(rejection, deadline, formatDateTime));
      return;
    }

    try {
      await mutateAsync({ scheduledStartAt: chosen.toISOString() });
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  return (
    <View style={styles.card} accessibilityLabel="Periodic maintenance scheduling">
      <Text style={styles.title}>
        {ticket.isPeriodicMaintenanceOverdue
          ? 'Maintenance is overdue'
          : 'Time for periodic maintenance'}
      </Text>

      <Text style={styles.text}>
        {ticket.periodicMaintenanceDueAtUtc
          ? `Due ${formatDateTime(ticket.periodicMaintenanceDueAtUtc)}. `
          : ''}
        Pick a time that suits you and we will send a technician.
      </Text>

      {deadline ? (
        <Text style={styles.deadline}>
          Choose before {formatDateTime(deadline)}
          {daysLeft !== null ? ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : ''}
        </Text>
      ) : null}

      <Pressable style={styles.picker} onPress={openPicker} accessibilityRole="button">
        <Text style={chosen ? styles.pickerValue : styles.pickerPlaceholder}>
          {chosen ? formatDateTime(chosen) : 'Select a date and time'}
        </Text>
      </Pressable>

      {pickerMode ? (
        <DateTimePicker
          value={chosen ?? new Date()}
          mode={pickerMode}
          minimumDate={new Date()}
          maximumDate={deadline ? new Date(deadline) : undefined}
          onChange={onPickerChange}
        />
      ) : null}

      <Pressable
        style={[styles.submit, (!chosen || isPending) && styles.submitDisabled]}
        onPress={submit}
        disabled={!chosen || isPending}
        accessibilityRole="button"
      >
        {isPending ? (
          <ActivityIndicator color={Colors.text} />
        ) : (
          <Text style={styles.submitText}>Confirm this time</Text>
        )}
      </Pressable>

      <Text style={styles.footnote}>
        If you do not choose in time, your manager will arrange the visit for you.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card2, padding: 12, borderRadius: 14, gap: 8 },
  title: { color: Colors.text, fontWeight: '800' },
  text: { color: Colors.textMute, fontSize: 12 },
  deadline: { color: Colors.warning, fontSize: 12, fontWeight: '600' },
  picker: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pickerValue: { color: Colors.text, fontSize: 14 },
  pickerPlaceholder: { color: Colors.textMute, fontSize: 14 },
  submit: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: Colors.text, fontWeight: '700' },
  footnote: { color: Colors.textMute, fontSize: 11, fontStyle: 'italic' },
});
