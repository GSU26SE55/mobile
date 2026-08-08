import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Shadow } from '@/src/lib/theme';
import { AttachmentPicker, UploadedAttachment } from '@/src/features/file-storage/components/AttachmentPicker';
import { FilePurposeEnum } from '@/src/features/file-storage/enums/file-storage.enum';
import { MaintenanceLogTypeEnum } from '@/src/shared/enums/ticket.enum';
import type { MaintenanceLogPayload } from '../types/staff.types';

// BE distinguishes 4 types for compliance reporting — don't hardcode one value for every log.
const LOG_TYPE_OPTIONS: { value: MaintenanceLogTypeEnum; label: string }[] = [
  { value: MaintenanceLogTypeEnum.RemoteSupport, label: 'Remote support' },
  { value: MaintenanceLogTypeEnum.OnSite, label: 'On-site' },
  { value: MaintenanceLogTypeEnum.PartReplacement, label: 'Part replacement' },
  { value: MaintenanceLogTypeEnum.Inspection, label: 'Inspection' },
];

interface Props {
  isLoading: boolean;
  onSubmit: (data: MaintenanceLogPayload) => void;
  // GH-44 — reused for editing a log (PATCH): prefill text fields. Photos are not prefilled (PATCH partial — leaving blank keeps them unchanged).
  initialValues?: Pick<
    MaintenanceLogPayload,
    'summary' | 'actionsTaken' | 'partsUsed' | 'durationMinutes' | 'logType'
  >;
  title?: string;
  submitLabel?: string;
}

export function MaintenanceLogForm({ isLoading, onSubmit, initialValues, title, submitLabel }: Props) {
  const [logType, setLogType] = useState<MaintenanceLogTypeEnum>(
    initialValues?.logType ?? MaintenanceLogTypeEnum.OnSite,
  );
  const [description, setDescription] = useState(initialValues?.summary ?? '');
  const [actionTaken, setActionTaken] = useState(initialValues?.actionsTaken ?? '');
  const [partsUsed, setPartsUsed] = useState(initialValues?.partsUsed ?? '');
  const [duration, setDuration] = useState(
    initialValues?.durationMinutes != null ? String(initialValues.durationMinutes) : '',
  );
  const [beforePhotos, setBeforePhotos] = useState<UploadedAttachment[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<UploadedAttachment[]>([]);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const uploading = uploadingBefore || uploadingAfter;
  const [error, setError] = useState('');
  const [durationError, setDurationError] = useState('');

  const handleSubmit = () => {
    const trimmed = description.trim();
    if (trimmed.length < 5) {
      setError('Description must be at least 5 characters');
      return;
    }

    // startedAt is derived backward from duration → leaving it blank would produce a 0-minute log, skewing SLA reports.
    const durationMinutes = parseInt(duration, 10);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setDurationError('Enter a number of minutes > 0');
      return;
    }

    // BE requires StartedAt. This form records work that has ALREADY been completed → completedAt = now.
    const completedAt = new Date();
    const startedAt = new Date(completedAt.getTime() - durationMinutes * 60_000);

    onSubmit({
      summary: trimmed,
      logType,
      actionsTaken: actionTaken.trim() || undefined,
      partsUsed: partsUsed.trim() || undefined,
      durationMinutes,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      beforePhotos: beforePhotos.length > 0 ? beforePhotos : undefined,
      afterPhotos: afterPhotos.length > 0 ? afterPhotos : undefined,
    });
    setLogType(MaintenanceLogTypeEnum.OnSite);
    setDescription('');
    setActionTaken('');
    setPartsUsed('');
    setDuration('');
    setBeforePhotos([]);
    setAfterPhotos([]);
    setError('');
    setDurationError('');
  };

  return (
    <View style={[styles.container, Shadow]}>
      <Text style={styles.title}>{title ?? 'Log maintenance entry'}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Work type *</Text>
        <View style={styles.chipRow}>
          {LOG_TYPE_OPTIONS.map((opt) => {
            const selected = logType === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setLogType(opt.value)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Work description *</Text>
        <TextInput
          style={[styles.input, styles.inputLarge, error ? styles.inputError : null]}
          value={description}
          onChangeText={(t) => { setDescription(t); setError(''); }}
          placeholder="Describe the work performed..."
          placeholderTextColor={Colors.textFaint}
          multiline
          textAlignVertical="top"
          maxLength={1000}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Actions taken</Text>
        <TextInput
          style={styles.input}
          value={actionTaken}
          onChangeText={setActionTaken}
          placeholder="e.g. Replaced inverter module, cleaned connections..."
          placeholderTextColor={Colors.textFaint}
          maxLength={500}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Parts used</Text>
          <TextInput
            style={styles.input}
            value={partsUsed}
            onChangeText={setPartsUsed}
            placeholder="e.g. Module XYZ"
            placeholderTextColor={Colors.textFaint}
            maxLength={200}
          />
        </View>
        <View style={[styles.field, { width: 110 }]}>
          <Text style={styles.label}>Duration (min) *</Text>
          <TextInput
            style={[styles.input, durationError ? styles.inputError : null]}
            value={duration}
            onChangeText={(t) => { setDuration(t); setDurationError(''); }}
            placeholder="30"
            placeholderTextColor={Colors.textFaint}
            keyboardType="numeric"
            maxLength={4}
          />
          {durationError ? <Text style={styles.errorText}>{durationError}</Text> : null}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Before / after photos</Text>
        <AttachmentPicker
          purpose={FilePurposeEnum.MaintenancePhoto}
          value={beforePhotos}
          onChange={setBeforePhotos}
          onUploadingChange={setUploadingBefore}
          label="Before photo"
        />
        <AttachmentPicker
          purpose={FilePurposeEnum.MaintenancePhoto}
          value={afterPhotos}
          onChange={setAfterPhotos}
          onUploadingChange={setUploadingAfter}
          label="After photo"
        />
      </View>

      <Pressable
        style={[styles.submitBtn, (isLoading || uploading) && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={isLoading || uploading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitText}>{submitLabel ?? 'Save log'}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMute,
  },
  input: {
    backgroundColor: Colors.card2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputLarge: {
    minHeight: 80,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.card2,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: Colors.info,
    borderColor: Colors.info,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMute,
  },
  chipTextSelected: {
    color: '#fff',
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  submitBtn: {
    backgroundColor: Colors.info,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
