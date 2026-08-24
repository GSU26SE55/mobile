import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { handleErrorApi } from '@/src/lib/errors';
import { formatDateTime } from '@/src/lib/date';
import { Colors, Shadow, ShadowPrimary } from '@/src/lib/theme';
import { BottomSheet } from '@/src/shared/components/BottomSheet';
import { useSchedulePeriodicMaintenance } from '../hooks/useSchedulePeriodicMaintenance';
import { TicketStatusEnum, type TicketDTO } from '../types/ticket.types';

type PeriodicTicket = Pick<
  TicketDTO,
  | 'id'
  | 'status'
  | 'scheduledStartAtUtc'
  | 'periodicMaintenanceDueAtUtc'
  | 'periodicMaintenanceScheduleDeadlineAtUtc'
  | 'isPeriodicMaintenanceOverdue'
>;

interface Props {
  ticket: PeriodicTicket;
}

const MINUTE_MS = 60_000;

function validDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function initialSchedule(ticket: PeriodicTicket): Date {
  const earliest = new Date(Date.now() + 60 * MINUTE_MS);
  earliest.setSeconds(0, 0);
  const deadline = validDate(ticket.periodicMaintenanceScheduleDeadlineAtUtc);

  const selected = validDate(ticket.scheduledStartAtUtc);
  if (selected && selected.getTime() > Date.now() && (!deadline || selected <= deadline)) {
    return selected;
  }

  const due = validDate(ticket.periodicMaintenanceDueAtUtc);
  if (due && due >= earliest && (!deadline || due <= deadline)) return due;

  // An overdue cycle receives a fresh scheduling deadline. Start one hour from now,
  // clamped to that deadline so the picker always opens with a valid candidate.
  if (deadline && earliest > deadline) return deadline;
  return earliest;
}

export function PeriodicMaintenanceScheduleCard({ ticket }: Props) {
  const { mutateAsync, isPending } = useSchedulePeriodicMaintenance(ticket.id);
  const [visible, setVisible] = useState(false);
  const [schedule, setSchedule] = useState(() => initialSchedule(ticket));
  const [pickerStage, setPickerStage] = useState<'idle' | 'date' | 'time'>('idle');
  const [pendingValue, setPendingValue] = useState<Date | null>(null);
  const [fieldError, setFieldError] = useState('');

  const due = validDate(ticket.periodicMaintenanceDueAtUtc);
  const deadline = validDate(ticket.periodicMaintenanceScheduleDeadlineAtUtc);
  const selected = validDate(ticket.scheduledStartAtUtc);
  const windowExpired = !deadline || deadline.getTime() <= Date.now();
  const canSchedule = ticket.status === TicketStatusEnum.Open && !windowExpired;

  const open = () => {
    setSchedule(initialSchedule(ticket));
    setPickerStage('idle');
    setPendingValue(null);
    setFieldError('');
    setVisible(true);
  };

  const close = () => {
    if (isPending) return;
    setPickerStage('idle');
    setPendingValue(null);
    setFieldError('');
    setVisible(false);
  };

  const commitPickerStage = (value: Date) => {
    if (pickerStage === 'date') {
      const next = new Date(value);
      next.setHours(schedule.getHours(), schedule.getMinutes(), 0, 0);
      setSchedule(next);
      setPickerStage('time');
      setPendingValue(null);
      return;
    }

    const next = new Date(schedule);
    next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    setSchedule(next);
    setPickerStage('idle');
    setPendingValue(null);
  };

  const onPickerChange = (event: DateTimePickerEvent, value?: Date) => {
    if (event.type === 'dismissed') {
      setPickerStage('idle');
      setPendingValue(null);
      return;
    }
    if (!value) return;
    if (Platform.OS === 'ios') {
      setPendingValue(value);
      return;
    }
    commitPickerStage(value);
  };

  const submit = async () => {
    setFieldError('');
    if (schedule.getTime() <= Date.now()) {
      setFieldError('Visit schedule must be in the future.');
      return;
    }
    if (!deadline || schedule > deadline) {
      setFieldError('Visit schedule must not be later than the scheduling deadline.');
      return;
    }

    try {
      await mutateAsync({ scheduledStartAt: schedule.toISOString() });
      setVisible(false);
      Alert.alert('Schedule saved', 'Your periodic maintenance visit schedule has been saved.');
    } catch (error) {
      handleErrorApi({
        error,
        setFieldError: (field, message) => {
          if (field === 'scheduledStartAt') setFieldError(message);
        },
      });
    }
  };

  return (
    <>
      <View style={[styles.card, Shadow]}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="calendar-number-outline" size={20} color={Colors.primaryDark} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Periodic maintenance</Text>
            <Text style={[styles.state, ticket.isPeriodicMaintenanceOverdue && styles.overdue]}>
              {ticket.isPeriodicMaintenanceOverdue ? 'Maintenance is overdue' : 'Six-month maintenance cycle'}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Maintenance due</Text>
            <Text style={styles.detailValue}>{formatDateTime(due)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Selected visit</Text>
            <Text style={[styles.detailValue, !selected && styles.unselected]}>
              {selected ? formatDateTime(selected) : 'Not selected'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Select before</Text>
            <Text style={styles.detailValue}>{formatDateTime(deadline)}</Text>
          </View>
        </View>

        {canSchedule ? (
          <Pressable style={[styles.scheduleButton, ShadowPrimary]} onPress={open}>
            <Ionicons name="calendar-outline" size={17} color="#fff" />
            <Text style={styles.scheduleButtonText}>
              {selected ? 'Change visit schedule' : 'Select visit schedule'}
            </Text>
          </Pressable>
        ) : windowExpired && ticket.status === TicketStatusEnum.Open ? (
          <Text style={styles.helperText}>
            The Customer scheduling window has expired. A Manager will select the visit schedule.
          </Text>
        ) : selected ? (
          <Text style={styles.helperText}>The visit schedule is confirmed and can no longer be changed.</Text>
        ) : null}
      </View>

      <BottomSheet visible={visible} onClose={close}>
        <View style={styles.sheetBody}>
          <Text style={styles.sheetTitle}>{selected ? 'Change visit schedule' : 'Select visit schedule'}</Text>
          <Text style={styles.sheetDescription}>
            Choose a local date and time no later than {formatDateTime(deadline)}.
          </Text>

          <Pressable style={styles.pickerButton} onPress={() => setPickerStage('date')}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primaryDark} />
            <View style={styles.pickerButtonText}>
              <Text style={styles.pickerLabel}>Visit date and time</Text>
              <Text style={styles.pickerValue}>{formatDateTime(schedule)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMute} />
          </Pressable>
          {fieldError ? <Text style={styles.errorText}>{fieldError}</Text> : null}

          {pickerStage !== 'idle' && Platform.OS === 'android' && (
            <DateTimePicker
              value={schedule}
              mode={pickerStage}
              is24Hour
              minimumDate={pickerStage === 'date' ? new Date(Date.now() + MINUTE_MS) : undefined}
              maximumDate={pickerStage === 'date' ? deadline ?? undefined : undefined}
              onChange={onPickerChange}
            />
          )}

          {pickerStage !== 'idle' && Platform.OS === 'ios' && (
            <Modal transparent animationType="fade" onRequestClose={() => setPickerStage('idle')}>
              <View style={styles.pickerOverlay}>
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerHeader}>
                    <Pressable onPress={() => { setPickerStage('idle'); setPendingValue(null); }}>
                      <Text style={styles.pickerCancel}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={() => commitPickerStage(pendingValue ?? schedule)}>
                      <Text style={styles.pickerDone}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={schedule}
                    mode={pickerStage}
                    is24Hour
                    display="spinner"
                    minimumDate={pickerStage === 'date' ? new Date(Date.now() + MINUTE_MS) : undefined}
                    maximumDate={pickerStage === 'date' ? deadline ?? undefined : undefined}
                    onChange={onPickerChange}
                  />
                </View>
              </View>
            </Modal>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={close} disabled={isPending}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={submit} disabled={isPending}>
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Save schedule</Text>
              )}
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '800', color: Colors.text },
  state: { fontSize: 12, fontWeight: '600', color: Colors.textMute },
  overdue: { color: Colors.danger },
  details: { gap: 9 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel: { fontSize: 12, color: Colors.textMute, fontWeight: '500' },
  detailValue: { flex: 1, textAlign: 'right', fontSize: 12, color: Colors.text, fontWeight: '700' },
  unselected: { color: Colors.warningDark },
  scheduleButton: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scheduleButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  helperText: { fontSize: 12, lineHeight: 18, color: Colors.textMute, fontWeight: '500' },
  sheetBody: { gap: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sheetDescription: { fontSize: 13, lineHeight: 19, color: Colors.textMute, fontWeight: '500' },
  pickerButton: {
    minHeight: 62,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.card2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerButtonText: { flex: 1, gap: 3 },
  pickerLabel: { fontSize: 11, color: Colors.textMute, fontWeight: '600' },
  pickerValue: { fontSize: 14, color: Colors.text, fontWeight: '700' },
  errorText: { marginTop: -8, fontSize: 12, color: Colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  submitButton: {
    flex: 1.4,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  pickerCancel: { fontSize: 15, fontWeight: '600', color: Colors.textMute },
  pickerDone: { fontSize: 15, fontWeight: '700', color: Colors.primary },
});
