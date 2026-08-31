import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateTime } from '@/src/lib/date';
import { Colors, Radius, Solar } from '@/src/lib/theme';
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
  visible: boolean;
  onClose: () => void;
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

function targetLabel(target: BmsSwitchTarget): string {
  if (target === BmsSwitchTarget.All) return 'both';
  return target === BmsSwitchTarget.Discharge ? 'discharge' : 'charge';
}

// Nhãn On/Off VIẾT RA chứ không chỉ đổi màu — trạng thái phải đọc được với người mù màu.
function stateLabel(value: boolean | null | undefined, pending: boolean): string {
  if (pending) return 'Waiting…';
  if (value == null) return 'Unknown';
  return value ? 'On' : 'Off';
}

function consequenceText(target: BmsSwitchTarget, enable: boolean): string {
  if (target === BmsSwitchTarget.All) {
    return enable
      ? 'The battery will resume both accepting charge current and supplying power to the load.'
      : 'The battery will stop both accepting charge current and supplying power to the load.';
  }
  if (target === BmsSwitchTarget.Discharge) {
    return enable
      ? 'The battery will resume supplying power to the load.'
      : 'The battery will stop supplying power to the load.';
  }
  return enable
    ? 'The battery will resume accepting charge current.'
    : 'The battery will stop accepting charge current.';
}

// Bottom sheet opened by the lightning button on the battery hero. Same control and
// confirmation flow the web popover uses — the sheet is only the shell, so the safety
// rules (verified readback, high-risk confirmation) stay identical across platforms.
export function BmsSwitchSheet({ assetId, cascade, visible, onClose }: Props) {
  const stateQuery = useBmsSwitch(assetId);
  const mutation = useSetBmsSwitch(assetId);
  const [highRiskConfirmation, setHighRiskConfirmation] = useState<SetBmsSwitchPayload | null>(null);
  // Mặc định trùng web: cắt TẤT CẢ. Đó là ca khẩn cấp mà người ta mở control này ra để làm.
  const [pickTarget, setPickTarget] = useState<BmsSwitchTarget>(BmsSwitchTarget.All);
  const [pickEnable, setPickEnable] = useState(false);
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
      Alert.alert('BMS control command failed', commandFailureMessage(lastCommand.status));
    }
  }, [lastCommand]);

  // "Both" gửi HAI lệnh TUẦN TỰ (charge rồi discharge), không phải một lệnh `target: "all"`.
  // Firmware chỉ map charge=1 / discharge=2 nên `"all"` rớt validation ở thiết bị và ack `failed`;
  // hai lệnh rời chạy được với firmware đang nạp, và backend không chặn vì hai MOSFET khác nhau
  // không tính là xung đột. Mỗi MOSFET cũng có ack + readback riêng, nên hỏng một nửa nhìn ra ngay.
  const submitOne = (payload: SetBmsSwitchPayload) =>
    mutation.mutateAsync(payload).then((accepted) => {
      issuedCmdId.current = accepted.cmdId;
      void stateQuery.refetch();
      return accepted;
    });

  const reportError = (error: unknown) =>
    Alert.alert(
      'Unable to send command',
      error instanceof Error ? error.message : 'Unable to send the command to the device.',
    );

  const submit = (payload: SetBmsSwitchPayload) => {
    if (payload.target !== BmsSwitchTarget.All) {
      submitOne(payload).catch(reportError);
      return;
    }

    void (async () => {
      try {
        await submitOne({ target: BmsSwitchTarget.Charge, enable: payload.enable });
      } catch (error) {
        reportError(error);
        // TẮT thì vẫn đi tiếp — cô lập được vế nào hay vế đó. BẬT thì dừng, không để pin bật
        // nửa vời trong khi vế kia lỗi.
        if (payload.enable) return;
      }
      try {
        await submitOne({ target: BmsSwitchTarget.Discharge, enable: payload.enable });
      } catch (error) {
        reportError(error);
      }
    })();
  };

  const confirm = (target: BmsSwitchTarget, enable: boolean) => {
    if (highRisk) {
      setHighRiskConfirmation({ target, enable });
      return;
    }
    Alert.alert(
      `${enable ? 'Enable' : 'Disable'} ${targetLabel(target)} MOSFET?`,
      `${consequenceText(target, enable)}\n\nSuccess is reported only after the BMS responds with a verified readback state.`,
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

  const pending = stateQuery.data?.pendingCommand != null || mutation.isPending;
  const updatedLabel = formatUpdatedAt(stateQuery.data?.updatedAt);

  // The device does not expose BMS control (404), or the firmware rejected it as
  // unsupported — say so rather than showing switches that cannot work.
  const unavailable =
    queryError?.statusCode === 404
    || (lastCommand?.status === BmsSwitchCommandStatus.Rejected
        && isUnsupportedReason(lastCommand.deviceReason));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="flash" size={20} color={Solar.yellowDeep} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>BMS MOSFET Control</Text>
              <Text style={styles.subtitle}>Actual state read back from the JK BMS</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={Colors.textMute} />
            </Pressable>
          </View>

          {highRisk && !unavailable ? (
            <View style={styles.riskBanner}>
              <Ionicons name="warning" size={16} color={Colors.dangerDark} />
              <Text style={styles.riskBannerText}>
                This battery has a high cascade risk. Inspect the site before re-enabling a MOSFET.
              </Text>
            </View>
          ) : null}

          {stateQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={Solar.yellowDeep} />
            </View>
          ) : unavailable ? (
            <Text style={styles.error}>
              This device does not support remote BMS control.
            </Text>
          ) : queryError ? (
            <Text style={styles.error}>{queryError.message}</Text>
          ) : (
            <>
              {/* Trạng thái hiện tại đứng trước — đó là thứ người vận hành xem trước khi quyết
                  định. Nó là hiển thị CHỈ-ĐỌC, không phải cái công tắc: mô hình toggle cũ giấu
                  hướng thao tác vào trạng thái hiện tại, nên phải đọc nhãn phụ mới biết chạm vào
                  sẽ ra gì. Icon là hướng dòng điện (vào pack / ra tải) chứ không phải hai biểu
                  tượng power giống hệt nhau. */}
              <View style={styles.stateRow}>
                <StateTile
                  label="Charge"
                  icon="arrow-down"
                  value={stateQuery.data?.chargeEnabled}
                  pending={pending}
                />
                <StateTile
                  label="Discharge"
                  icon="arrow-up"
                  value={stateQuery.data?.dischargeEnabled}
                  pending={pending}
                />
              </View>
              <Text style={styles.updatedLine}>{updatedLabel}</Text>

              {/* Chọn MOSFET → chọn hướng → xác nhận. Cùng thứ tự với dialog trên web: hai màn
                  điều khiển cùng một phần cứng thì không được bắt người dùng nhớ hai lối nghĩ. */}
              <View style={styles.segment}>
                {([
                  { value: BmsSwitchTarget.All, label: 'Both' },
                  { value: BmsSwitchTarget.Charge, label: 'Charge' },
                  { value: BmsSwitchTarget.Discharge, label: 'Discharge' },
                ] as const).map((option) => (
                  <Pressable
                    key={option.value}
                    style={[styles.segmentItem, pickTarget === option.value && styles.segmentItemOn]}
                    disabled={pending}
                    accessibilityRole="button"
                    accessibilityState={{ selected: pickTarget === option.value, disabled: pending }}
                    onPress={() => setPickTarget(option.value)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        pickTarget === option.value && styles.segmentTextOn,
                        pending && styles.segmentTextOff,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.segment}>
                {([
                  { value: false, label: 'Turn off', icon: 'power' },
                  { value: true, label: 'Turn on', icon: 'power' },
                ] as const).map((option) => (
                  <Pressable
                    key={String(option.value)}
                    style={[styles.segmentItem, pickEnable === option.value && styles.segmentItemOn]}
                    disabled={pending}
                    accessibilityRole="button"
                    accessibilityState={{ selected: pickEnable === option.value, disabled: pending }}
                    onPress={() => setPickEnable(option.value)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={14}
                      color={
                        pickEnable === option.value
                          ? (option.value ? Colors.successDark : Colors.danger)
                          : Colors.textMute
                      }
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        pickEnable === option.value && styles.segmentTextOn,
                        pending && styles.segmentTextOff,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[
                  styles.applyBtn,
                  pickEnable ? styles.applyBtnOn : styles.applyBtnOff,
                  pending && styles.applyBtnDisabled,
                ]}
                disabled={pending}
                accessibilityRole="button"
                onPress={() => confirm(pickTarget, pickEnable)}
              >
                <Ionicons name="power" size={16} color={Colors.white} />
                <Text style={styles.applyBtnText}>
                  {pickEnable ? 'Turn on' : 'Turn off'} {targetLabel(pickTarget)}
                </Text>
              </Pressable>

              {pending ? (
                <View style={styles.pendingRow}>
                  <ActivityIndicator size="small" color={Solar.yellowDeep} />
                  <Text style={styles.pendingText}>Sending command to device…</Text>
                </View>
              ) : null}
            </>
          )}

          <HighRiskConfirmDialog
            confirmation={highRiskConfirmation}
            submitting={mutation.isPending}
            onCancel={() => setHighRiskConfirmation(null)}
            onConfirm={(payload) => {
              setHighRiskConfirmation(null);
              submit(payload);
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
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

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
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
          <Text style={styles.modalConsequence}>
            {consequenceText(confirmation.target, confirmation.enable)}
          </Text>
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

function StateTile({
  label,
  icon,
  value,
  pending,
}: {
  label: string;
  icon: 'arrow-down' | 'arrow-up';
  value: boolean | null | undefined;
  pending: boolean;
}) {
  const unknown = value == null;
  const tone = pending || unknown
    ? Colors.textMute
    : value
      ? Colors.successDark
      : Colors.danger;

  return (
    <View style={styles.stateTile}>
      <Text style={styles.stateTileLabel}>{label}</Text>
      <View style={styles.stateTileValueRow}>
        <Ionicons name={icon} size={14} color={tone} />
        <Text style={[styles.stateTileValue, { color: tone }]}>
          {stateLabel(value, pending)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 34,
    gap: 4,
  },
  grabber: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.graySoft,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Solar.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '900', color: Colors.accent },
  subtitle: { fontSize: 11, fontWeight: '600', color: Colors.textMute, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.graySoft,
  },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerLight,
    padding: 10,
    marginBottom: 4,
  },
  riskBannerText: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.dangerDark, lineHeight: 17 },
  centered: { paddingVertical: 28, alignItems: 'center' },
  stateRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stateTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stateTileLabel: { fontSize: 10.5, fontWeight: '700', color: Colors.textMute },
  stateTileValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  stateTileValue: { fontSize: 14, fontWeight: '800' },
  updatedLine: { fontSize: 10.5, color: Colors.textMute, marginTop: 6, marginBottom: 2 },
  segment: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: Colors.graySoft,
    borderRadius: Radius.md,
    padding: 4,
    marginTop: 8,
  },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
  },
  segmentItemOn: { backgroundColor: Colors.white },
  segmentText: { fontSize: 12.5, fontWeight: '700', color: Colors.textMute },
  segmentTextOn: { color: Colors.accent, fontWeight: '800' },
  segmentTextOff: { opacity: 0.5 },
  applyBtn: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.md,
    marginTop: 12,
  },
  applyBtnOn: { backgroundColor: Colors.successDark },
  applyBtnOff: { backgroundColor: Colors.danger },
  applyBtnDisabled: { opacity: 0.5 },
  applyBtnText: { color: Colors.white, fontSize: 14, fontWeight: '800' },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 10,
  },
  pendingText: { fontSize: 12, fontWeight: '700', color: Colors.textMute },
  error: { paddingVertical: 16, color: Colors.dangerDark, fontSize: 13, lineHeight: 19 },
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
