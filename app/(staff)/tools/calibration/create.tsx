import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../../src/lib/theme';
import { handleErrorApi } from '../../../../src/lib/errors';
import { useCreateCalibration } from '../../../../src/features/iot-devices/hooks/useCreateCalibration';
import { createCalibrationSchema } from '../../../../src/features/iot-devices/schemas/calibration.schema';
import {
  CalibrationChannel,
  CALIBRATION_CHANNEL_LABEL,
} from '../../../../src/features/iot-devices/enums/iot-device.enum';

const CHANNELS = Object.values(CalibrationChannel);

// Field component nhỏ gọn
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  );
}

export default function CreateCalibrationScreen() {
  const insets = useSafeAreaInsets();
  const { deviceId, deviceCode } = useLocalSearchParams<{ deviceId: string; deviceCode: string }>();
  const createMut = useCreateCalibration(deviceId ?? '');

  // L1: prefill scale=1, offset=0
  const [channel, setChannel] = useState<string>(CalibrationChannel.Voltage);
  const [unit, setUnit] = useState('');
  const [scale, setScale] = useState('1');
  const [offset, setOffset] = useState('0');
  const [expiry, setExpiry] = useState(''); // YYYY-MM-DD (tuỳ chọn)
  const [batteryAssetId, setBatteryAssetId] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, message: string) =>
    setErrors((prev) => ({ ...prev, [field]: message }));

  const onSubmit = async () => {
    setErrors({});

    // Guard: ngày sai định dạng → new Date(...).toISOString() ném RangeError → set field error thay vì crash.
    let expiresAtIso: string | undefined;
    if (expiry.trim()) {
      const d = new Date(`${expiry.trim()}T00:00:00.000Z`);
      if (Number.isNaN(d.getTime())) {
        setErrors({ expiresAt: 'Ngày không hợp lệ (định dạng YYYY-MM-DD)' });
        return;
      }
      expiresAtIso = d.toISOString();
    }

    const candidate = {
      channel,
      unit,
      scale: Number(scale),
      offset: Number(offset),
      calibratedAt: new Date().toISOString(), // thời điểm hiệu chỉnh = bây giờ
      expiresAt: expiresAtIso,
      batteryAssetId: batteryAssetId.trim() || null,
      notes: notes.trim() || undefined,
    };

    const parsed = createCalibrationSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((iss) => {
        const key = String(iss.path[0] ?? '');
        if (key && !next[key]) next[key] = iss.message;
      });
      setErrors(next);
      return;
    }

    try {
      await createMut.mutateAsync(parsed.data);
      Alert.alert('Thành công', 'Đã thêm bản hiệu chỉnh.');
      router.back();
    } catch (error) {
      handleErrorApi({ error, setFieldError });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Thêm calibration</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.deviceHint}>Thiết bị: {deviceCode}</Text>

        <Field label="Channel" error={errors.channel}>
          <View style={styles.chips}>
            {CHANNELS.map((c) => {
              const active = channel === c;
              return (
                <Pressable
                  key={c}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setChannel(c)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {CALIBRATION_CHANNEL_LABEL[c]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Đơn vị (V / A / °C / %)" error={errors.unit}>
          <TextInput
            style={styles.input}
            value={unit}
            onChangeText={setUnit}
            placeholder="V"
            placeholderTextColor={Colors.textMute}
            autoCapitalize="none"
          />
        </Field>

        <View style={styles.row}>
          <View style={styles.half}>
            <Field label="Scale (≠ 0)" error={errors.scale}>
              <TextInput
                style={styles.input}
                value={scale}
                onChangeText={setScale}
                keyboardType="numbers-and-punctuation"
                placeholder="1"
                placeholderTextColor={Colors.textMute}
              />
            </Field>
          </View>
          <View style={styles.half}>
            <Field label="Offset" error={errors.offset}>
              <TextInput
                style={styles.input}
                value={offset}
                onChangeText={setOffset}
                keyboardType="numbers-and-punctuation"
                placeholder="0"
                placeholderTextColor={Colors.textMute}
              />
            </Field>
          </View>
        </View>

        <Field label="Ngày hết hạn (YYYY-MM-DD, tuỳ chọn)" error={errors.expiresAt}>
          <TextInput
            style={styles.input}
            value={expiry}
            onChangeText={setExpiry}
            placeholder="2027-01-01"
            placeholderTextColor={Colors.textMute}
            autoCapitalize="none"
          />
        </Field>

        <Field label="Battery Asset ID (tuỳ chọn — bỏ trống = cấp device)" error={errors.batteryAssetId}>
          <TextInput
            style={styles.input}
            value={batteryAssetId}
            onChangeText={setBatteryAssetId}
            placeholder="GUID pin cụ thể"
            placeholderTextColor={Colors.textMute}
            autoCapitalize="none"
          />
        </Field>

        <Field label="Ghi chú (tuỳ chọn)" error={errors.notes}>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ghi chú của kỹ thuật viên"
            placeholderTextColor={Colors.textMute}
            multiline
          />
        </Field>

        <Pressable
          style={[styles.submitBtn, createMut.isPending && styles.submitBtnDisabled]}
          onPress={onSubmit}
          disabled={createMut.isPending}
        >
          <Text style={styles.submitText}>
            {createMut.isPending ? 'Đang lưu…' : 'Lưu calibration'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  content: { padding: 16, paddingBottom: 40 },
  deviceHint: { fontSize: 13, color: Colors.textMute, marginBottom: 12 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  input: { backgroundColor: Colors.card, borderRadius: Radius.md, paddingHorizontal: 14, height: 46, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  textarea: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  errText: { fontSize: 12, color: Colors.danger, marginTop: 5 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.text },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
