import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateTime } from '@/src/lib/date';
import { Colors, Radius, Shadow } from '@/src/lib/theme';
import { HttpError } from '@/src/lib/errors';
import type { CascadeRiskDto } from '../types/cascade.types';
import {
  BmsSwitchCommandStatus,
  BmsSwitchTarget,
} from '../enums/bms-switch.enum';
import type { SetBmsSwitchPayload } from '../types/bms-switch.types';
import { useBmsSwitch } from '../hooks/useBmsSwitch';
import { useSetBmsSwitch } from '../hooks/useSetBmsSwitch';

interface Props {
  assetId: string;
  cascade: CascadeRiskDto | null | undefined;
}

const FAILED_STATUSES = new Set<number>([
  BmsSwitchCommandStatus.Failed,
  BmsSwitchCommandStatus.Rejected,
  BmsSwitchCommandStatus.Unknown,
  BmsSwitchCommandStatus.TimedOut,
]);

function isUnsupportedReason(reason: string | null | undefined): boolean {
  const normalized = reason?.toLowerCase() ?? '';
  return normalized.includes('unsupported')
    || normalized.includes('not support')
    || normalized.includes('verify');
}

function formatUpdatedAt(value: string | null | undefined): string {
  if (!value) return 'No verified state';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No verified state';
  return `Updated ${formatDateTime(date)}`;
}

function commandFailureMessage(status: number): string {
  if (status === BmsSwitchCommandStatus.Rejected) return 'The BMS rejected the control command.';
  if (status === BmsSwitchCommandStatus.Unknown) return 'The firmware did not recognize the BMS control command.';
  if (status === BmsSwitchCommandStatus.TimedOut) return 'The BMS control command timed out.';
  return 'The BMS control command failed.';
}

export function BmsSwitchCard({ assetId, cascade }: Props) {
  const stateQuery = useBmsSwitch(assetId);
  const mutation = useSetBmsSwitch(assetId);
  const [highRiskConfirmation, setHighRiskConfirmation] = useState<SetBmsSwitchPayload | null>(null);
  const issuedCmdId = useRef<string | null>(null);
  const lastCommand = stateQuery.data?.lastCommand;
  const queryError = stateQuery.error instanceof HttpError ? stateQuery.error : null;
  const highRisk = cascade?.level === 'High' || (cascade?.cascadeRiskScore ?? 0) >= 0.7;

  useEffect(() => {
    if (!lastCommand || issuedCmdId.current !== lastCommand.cmdId) return;
    issuedCmdId.current = null;
    if (lastCommand.status === BmsSwitchCommandStatus.Ok) {
      Alert.alert('Confirmed', 'The BMS applied the command and the displayed state was read back from the device.');
      return;
    }
    if (FAILED_STATUSES.has(lastCommand.status)) {
      Alert.alert(
        'BMS control command failed',
        commandFailureMessage(lastCommand.status),
      );
    }
  }, [lastCommand]);

  if (queryError?.statusCode === 404) return null;
  if (lastCommand?.status === BmsSwitchCommandStatus.Rejected
      && isUnsupportedReason(lastCommand.error)) return null;

  const submit = (payload: SetBmsSwitchPayload) => {
    mutation.mutate(payload, {
      onSuccess: (accepted) => {
        issuedCmdId.current = accepted.cmdId;
        void stateQuery.refetch();
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Unable to send the command to the device.';
        Alert.alert('Unable to send command', message);
      },
    });
  };

  const confirm = (target: BmsSwitchTarget, enable: boolean) => {
    const isDischarge = target === BmsSwitchTarget.Discharge;
    const consequence = isDischarge
      ? (enable
          ? 'The battery will resume supplying power to the load.'
          : 'The battery will stop supplying power to the load.')
      : (enable
          ? 'The battery will resume accepting charge current.'
          : 'The battery will stop accepting charge current.');
    if (highRisk) {
      setHighRiskConfirmation({ target, enable });
      return;
    }

    Alert.alert(
      `${enable ? 'Enable' : 'Disable'} ${isDischarge ? 'discharge' : 'charge'} MOSFET?`,
      `${consequence}\n\nSuccess is reported only after the BMS responds with a verified readback state.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: !enable ? 'destructive' : 'default',
          onPress: () => submit({ target, enable }),
        },
      ],
    );
  };

  const chooseUnknownState = (target: BmsSwitchTarget) => {
    Alert.alert(
      'No verified state',
      'Choose the state to send to the BMS. The switch will update only after the device successfully reads the state back.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: () => confirm(target, false) },
        { text: 'Enable', onPress: () => confirm(target, true) },
      ],
    );
  };

  const pending = stateQuery.data?.pendingCommand != null || mutation.isPending;

  if (stateQuery.isLoading) {
    return (
      <View style={[styles.card, Shadow]}>
        <ActivityIndicator color={Colors.primaryDark} />
      </View>
    );
  }

  if (queryError) {
    return (
      <View style={[styles.card, Shadow]}>
        <Text style={styles.title}>BMS Control</Text>
        <Text style={styles.error}>{queryError.message}</Text>
      </View>
    );
  }

  const updatedLabel = formatUpdatedAt(stateQuery.data?.updatedAt);

  return (
    <View style={[styles.card, Shadow]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="power" size={20} color={Colors.primaryDark} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>BMS MOSFET Control</Text>
          <Text style={styles.subtitle}>Actual state read back from the JK BMS</Text>
        </View>
      </View>

      <SwitchRow
        label="Charge"
        value={stateQuery.data?.chargeEnabled}
        disabled={pending}
        updatedLabel={updatedLabel}
        onChange={(enable) => confirm(BmsSwitchTarget.Charge, enable)}
        onUnknown={() => chooseUnknownState(BmsSwitchTarget.Charge)}
      />
      <SwitchRow
        label="Discharge"
        value={stateQuery.data?.dischargeEnabled}
        disabled={pending}
        updatedLabel={updatedLabel}
        onChange={(enable) => confirm(BmsSwitchTarget.Discharge, enable)}
        onUnknown={() => chooseUnknownState(BmsSwitchTarget.Discharge)}
      />

      {pending ? (
        <View style={styles.pendingRow}>
          <ActivityIndicator size="small" color={Colors.primaryDark} />
          <Text style={styles.pendingText}>Sending command to device…</Text>
        </View>
      ) : null}

      <HighRiskConfirmDialog
        confirmation={highRiskConfirmation}
        submitting={mutation.isPending}
        onCancel={() => setHighRiskConfirmation(null)}
        onConfirm={(payload) => {
          setHighRiskConfirmation(null);
          submit(payload);
        }}
      />
    </View>
  );
}

function HighRiskConfirmDialog({
  confirmation,
  submitting,
  onCancel,
  onConfirm,
}: {
  confirmation: SetBmsSwitchPayload | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (payload: SetBmsSwitchPayload) => void;
}) {
  if (!confirmation) return null;

  const isDischarge = confirmation.target === BmsSwitchTarget.Discharge;
  const consequence = isDischarge
    ? (confirmation.enable
        ? 'The battery will resume supplying power to the load.'
        : 'The battery will stop supplying power to the load.')
    : (confirmation.enable
        ? 'The battery will resume accepting charge current.'
        : 'The battery will stop accepting charge current.');

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {confirmation.enable ? 'Enable' : 'Disable'} {isDischarge ? 'discharge' : 'charge'} MOSFET?
          </Text>
          <View style={styles.riskWarningBox}>
            <Ionicons name="warning" size={20} color={Colors.danger} />
            <Text style={styles.riskWarningText}>
              HIGH-RISK WARNING: This battery has a high cascade-risk assessment.
              {confirmation.enable
                ? ' Re-enabling the MOSFET may reconnect the battery to the electrical circuit.'
                : ''}
            </Text>
          </View>
          <Text style={styles.modalConsequence}>{consequence}</Text>
          <Text style={styles.modalHint}>
            Success is reported only after the BMS responds with a verified readback state.
          </Text>
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, styles.cancelButton]}
              disabled={submitting}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.confirmButton]}
              disabled={submitting}
              onPress={() => onConfirm(confirmation)}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SwitchRow({
  label,
  value,
  disabled,
  updatedLabel,
  onChange,
  onUnknown,
}: {
  label: string;
  value: boolean | null | undefined;
  disabled: boolean;
  updatedLabel: string;
  onChange: (value: boolean) => void;
  onUnknown: () => void;
}) {
  const unknown = value == null;
  return (
    <Pressable
      style={styles.switchRow}
      disabled={disabled || !unknown}
      onPress={onUnknown}
      accessibilityRole={unknown ? 'button' : undefined}
    >
      <View style={styles.switchText}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={[styles.updated, unknown && styles.unknown]}>{updatedLabel}</Text>
      </View>
      <Switch
        value={value ?? false}
        disabled={disabled || unknown}
        onValueChange={onChange}
        trackColor={{ false: Colors.graySoft, true: Colors.success }}
        thumbColor={Colors.white}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '900', color: Colors.accent },
  subtitle: { fontSize: 11, fontWeight: '600', color: Colors.textMute, marginTop: 2 },
  switchRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 10,
  },
  switchText: { flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  updated: { fontSize: 10.5, color: Colors.textMute, marginTop: 3 },
  unknown: { color: Colors.warningDark, fontWeight: '700' },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
  },
  pendingText: { fontSize: 12, fontWeight: '700', color: Colors.textMute },
  error: { marginTop: 8, color: Colors.dangerDark, fontSize: 12, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.overlay,
  },
  modalCard: {
    borderRadius: Radius.lg,
    padding: 18,
    gap: 14,
    backgroundColor: Colors.white,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.accent },
  riskWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    padding: 12,
    backgroundColor: Colors.dangerLight,
  },
  riskWarningText: {
    flex: 1,
    color: Colors.dangerDark,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  modalConsequence: { color: Colors.accent, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  modalHint: { color: Colors.textMute, fontSize: 12, lineHeight: 18 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: {
    minWidth: 96,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
  cancelButton: { backgroundColor: Colors.graySoft },
  cancelButtonText: { color: Colors.accent, fontSize: 14, fontWeight: '800' },
  confirmButton: { backgroundColor: Colors.danger },
  confirmButtonText: { color: Colors.white, fontSize: 14, fontWeight: '800' },
});
