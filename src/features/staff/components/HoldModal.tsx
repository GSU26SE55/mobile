import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors } from "@/src/lib/theme";
import { BottomSheet } from "@/src/shared/components/BottomSheet";
import { PauseReasonEnum } from "@/src/features/tickets/types/ticket.types";
import { handleErrorApi } from "@/src/lib/errors";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { formatLocalSchedule } from "@/src/features/tickets/utils/scheduleTime";

const HOLD_OPTIONS: {
  value: PauseReasonEnum;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: PauseReasonEnum.CustomerUnavailable,
    label: "Customer unavailable",
    icon: "person-outline",
  },
  {
    value: PauseReasonEnum.WorkBlocked,
    label: "Work blocked",
    icon: "construct-outline",
  },
];

interface Props {
  visible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (
    reason: PauseReasonEnum,
    note: string,
    appointment: Date,
  ) => Promise<void>;
}

export function HoldModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<PauseReasonEnum | null>(null);
  const [note, setNote] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [appointment, setAppointment] = useState(
    () => new Date(Date.now() + 60 * 60_000),
  );
  // Chọn ngày rồi tới giờ. Trên Android picker là native dialog — render vô điều kiện thì khi
  // sheet đóng lúc dialog còn mở, thư viện gọi dismiss() trên mode đã unmount và crash.
  const [pickerStage, setPickerStage] = useState<"idle" | "date" | "time">(
    "idle",
  );
  // iOS renders the picker inline (spinner) with no confirm event of its own — onChange fires
  // continuously while scrolling, not once when "done". Buffer the value here and only commit
  // it (advance stage / close) when the user taps Done, so a mid-scroll value never sticks.
  const [pendingValue, setPendingValue] = useState<Date | null>(null);

  const onAppointmentChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === "dismissed") {
      setPickerStage("idle");
      setPendingValue(null);
      return;
    }
    if (!selected) return;
    if (Platform.OS === "ios") {
      // Buffer only — committed by the Done button below.
      setPendingValue(selected);
      return;
    }
    // Android native dialog: onChange fires once with the confirmed value.
    commitAppointmentStage(selected);
  };

  const commitAppointmentStage = (selected: Date) => {
    if (pickerStage === "date") {
      const next = new Date(selected);
      next.setHours(appointment.getHours(), appointment.getMinutes(), 0, 0);
      setAppointment(next);
      setPickerStage("time");
      setPendingValue(null);
      return;
    }
    // pickerStage === 'time'
    const next = new Date(appointment);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setAppointment(next);
    setPickerStage("idle");
    setPendingValue(null);
  };

  const handlePickerDone = () => {
    commitAppointmentStage(pendingValue ?? appointment);
  };

  const resetFields = () => {
    setPickerStage("idle");
    setPendingValue(null);
    setSelected(null);
    setNote("");
    setReasonError("");
    setAppointment(new Date(Date.now() + 60 * 60_000));
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setReasonError("");
    try {
      if (appointment.getTime() <= Date.now()) {
        setReasonError("Appointment must be in the future");
        return;
      }
      await onSubmit(selected, note.trim(), appointment);
      resetFields();
    } catch (error) {
      handleErrorApi({
        error,
        setFieldError: (field, message) => {
          if (field === "reason") setReasonError(message);
        },
      });
    }
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.body}>
        <Text style={styles.title}>Hold ticket</Text>
        <Text style={styles.desc}>
          Select a hold reason. The SLA timer will be paused.
        </Text>

        <View style={styles.options}>
          {HOLD_OPTIONS.map((opt) => {
            const active = selected === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => setSelected(opt.value)}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={active ? Colors.primary : Colors.textMute}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    active && styles.optionLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {active && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.primary}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
        {reasonError ? (
          <Text style={styles.errorText}>{reasonError}</Text>
        ) : null}

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
        <Pressable
          style={styles.dateBtn}
          onPress={() => setPickerStage("date")}
        >
          <Ionicons name="calendar-outline" size={18} color={Colors.textMute} />
          <Text style={styles.dateText}>
            New appointment: {formatLocalSchedule(appointment.toISOString())}
          </Text>
        </Pressable>
        {pickerStage !== "idle" && Platform.OS === "android" && (
          <DateTimePicker
            value={appointment}
            mode={pickerStage}
            is24Hour
            minimumDate={
              pickerStage === "date" ? new Date(Date.now() + 60_000) : undefined
            }
            onChange={onAppointmentChange}
          />
        )}
        {pickerStage !== "idle" && Platform.OS === "ios" && (
          <Modal transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <Pressable
                    onPress={() => {
                      setPickerStage("idle");
                      setPendingValue(null);
                    }}
                  >
                    <Text style={styles.pickerCancel}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handlePickerDone}>
                    <Text style={styles.pickerDone}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  // Uncontrolled while open: re-passing `value` on every onChange (spinner mode)
                  // snaps the wheel back to that value mid-scroll, making it look "stuck". Only
                  // read the buffered pendingValue back in when Done/Cancel commits the stage.
                  value={appointment}
                  mode={pickerStage}
                  is24Hour
                  display="spinner"
                  minimumDate={
                    pickerStage === "date"
                      ? new Date(Date.now() + 60_000)
                      : undefined
                  }
                  onChange={onAppointmentChange}
                />
              </View>
            </View>
          </Modal>
        )}

        <View style={styles.actions}>
          <Pressable style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.submitBtn,
              (!selected || !note.trim()) && styles.btnDisabled,
            ]}
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
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  pickerCancel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textMute,
  },
  pickerDone: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
  body: { gap: 16 },
  title: {
    fontSize: 18,
    fontWeight: "800",
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
    fontWeight: "500",
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
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.card2,
  },
  dateText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textMute,
    fontWeight: "500",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.card2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  optionLabelActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.card2,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.warning,
    alignItems: "center",
  },
  submitText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
