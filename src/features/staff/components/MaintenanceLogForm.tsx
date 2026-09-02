import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Shadow } from '@/src/lib/theme';
import { AttachmentPicker, UploadedAttachment } from '@/src/features/file-storage/components/AttachmentPicker';
import { FilePurposeEnum } from '@/src/features/file-storage/enums/file-storage.enum';
import { MaintenanceLogTypeEnum } from '@/src/shared/enums/ticket.enum';
import { handleErrorApi } from '@/src/lib/errors';
import type { TicketActivityDTO } from '@/src/features/tickets/types/ticket.types';
import { inProgressStartedAt } from '@/src/features/tickets/utils/ticketWorkflow';
import { AttachmentThumbnails } from '@/src/features/file-storage/components/AttachmentThumbnails';
import { formatDurationMinutes } from './ProcessingDurationTimer';
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
  onSubmit: (data: MaintenanceLogPayload) => Promise<void>;
  // GH-44 — reused for editing a log (PATCH): prefill text fields. Photos are not prefilled (PATCH partial — leaving blank keeps them unchanged).
  initialValues?: Pick<
    MaintenanceLogPayload,
    'summary' | 'diagnosisDetails' | 'actionsTaken' | 'resolutionNote' | 'partsUsed' | 'durationMinutes' | 'logType'
  >;
  title?: string;
  submitLabel?: string;
  // Complete flow: force LogType=Completion and hide the picker — the log's type doesn't
  // depend on what Staff chooses, it's determined by the action that created it.
  fixedLogType?: MaintenanceLogTypeEnum;
  /**
   * Ảnh đã lưu của log đang sửa. Chỉ để XEM: PATCH là partial nên để trống hai ô chọn
   * ảnh bên dưới nghĩa là "giữ nguyên", nhưng không hiện gì cả thì staff tưởng ảnh cũ
   * đã mất và chụp lại từ đầu.
   */
  existingBeforePhotoIds?: string[] | null;
  existingAfterPhotoIds?: string[] | null;
  /**
   * Activity log của ticket — dùng để lấy mốc InProgress gần nhất làm `startedAt` khi
   * submit. Duration luôn là ô nhập tay; activities không ảnh hưởng UI của nó.
   */
  activities?: TicketActivityDTO[];
}

export function MaintenanceLogForm({
  isLoading,
  onSubmit,
  initialValues,
  title,
  submitLabel,
  fixedLogType,
  activities,
  existingBeforePhotoIds,
  existingAfterPhotoIds,
}: Props) {
  const [logType, setLogType] = useState<MaintenanceLogTypeEnum>(
    fixedLogType ?? initialValues?.logType ?? MaintenanceLogTypeEnum.OnSite,
  );
  const [description, setDescription] = useState(initialValues?.summary ?? '');
  const [diagnosisDetails, setDiagnosisDetails] = useState(initialValues?.diagnosisDetails ?? '');
  const [actionTaken, setActionTaken] = useState(initialValues?.actionsTaken ?? '');
  const [resolutionNote, setResolutionNote] = useState(initialValues?.resolutionNote ?? '');
  const [partsUsed, setPartsUsed] = useState(initialValues?.partsUsed ?? '');
  const startedAt = useMemo(() => inProgressStartedAt(activities ?? []), [activities]);
  const [duration, setDuration] = useState(
    initialValues?.durationMinutes != null ? String(initialValues.durationMinutes) : '',
  );
  const [beforePhotos, setBeforePhotos] = useState<UploadedAttachment[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<UploadedAttachment[]>([]);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const uploading = uploadingBefore || uploadingAfter;
  const [error, setError] = useState('');

  const durationMins = parseInt(duration, 10);
  const hasExistingPhotos =
    (existingBeforePhotoIds?.length ?? 0) > 0 || (existingAfterPhotoIds?.length ?? 0) > 0;

  const handleSubmit = async () => {
    const trimmed = description.trim();
    if (!trimmed) {
      setError('Work summary is required');
      return;
    }

    const completedAt = new Date();
    const durationMinutes = duration.trim() ? parseInt(duration, 10) : undefined;

    try {
      await onSubmit({
        summary: trimmed,
        logType,
        diagnosisDetails: diagnosisDetails.trim() || undefined,
        actionsTaken: actionTaken.trim() || undefined,
        resolutionNote: resolutionNote.trim() || undefined,
        partsUsed: partsUsed.trim() || undefined,
        durationMinutes,
        // Mốc InProgress thật khi có. Không có (ticket chưa từng vào InProgress) thì
        // đóng dấu now — BE bắt buộc StartedAt, và bịa một khoảng thời gian giả còn
        // tệ hơn là ghi nhận khoảng rỗng.
        startedAt: startedAt ?? completedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        beforePhotos: beforePhotos.length > 0 ? beforePhotos : undefined,
        afterPhotos: afterPhotos.length > 0 ? afterPhotos : undefined,
      });
    } catch (err) {
      handleErrorApi({
        error: err,
        setFieldError: (field, message) => {
          if (field === 'summary') setError(message);
        },
      });
      return;
    }
    setLogType(fixedLogType ?? MaintenanceLogTypeEnum.OnSite);
    setDescription('');
    setDiagnosisDetails('');
    setActionTaken('');
    setResolutionNote('');
    setPartsUsed('');
    setDuration('');
    setBeforePhotos([]);
    setAfterPhotos([]);
    setError('');
  };

  return (
    <View style={[styles.container, Shadow]}>
      <Text style={styles.title}>{title ?? 'Log maintenance entry'}</Text>

      {!fixedLogType && (
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
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Work summary *</Text>
        <TextInput
          style={[styles.input, styles.inputLarge, error ? styles.inputError : null]}
          value={description}
          onChangeText={(t) => { setDescription(t); setError(''); }}
          placeholder="Describe the work performed..."
          placeholderTextColor={Colors.textFaint}
          multiline
          textAlignVertical="top"
          // Cột summary chỉ 500 ký tự — để 1000 thì BE nhận rồi ném ở tầng DB (500, không
          // phải 400), user mất trắng nội dung vừa gõ.
          maxLength={500}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Diagnosis details</Text>
        <TextInput
          style={styles.input}
          value={diagnosisDetails}
          onChangeText={setDiagnosisDetails}
          placeholder="Diagnosis results..."
          placeholderTextColor={Colors.textFaint}
          maxLength={500}
        />
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

      <View style={styles.field}>
        <Text style={styles.label}>Resolution note</Text>
        <TextInput
          style={styles.input}
          value={resolutionNote}
          onChangeText={setResolutionNote}
          placeholder="Outcome after handling..."
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
          <Text style={styles.label}>Duration</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="30"
            placeholderTextColor={Colors.textFaint}
            keyboardType="numeric"
            maxLength={4}
          />
          {/* Ô nhập phải giữ số phút thô để còn sửa được; dòng này dịch nó ra giờ
              để "729" không bắt người đọc tự chia 60. */}
          <Text style={styles.durationHint}>
            {durationMins > 0 ? formatDurationMinutes(durationMins) : 'minutes'}
          </Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Before / after photos</Text>
        {hasExistingPhotos && (
          <View style={styles.existingPhotos}>
            <Text style={styles.hint}>Already saved — kept unless you add new ones</Text>
            <AttachmentThumbnails fileIds={existingBeforePhotoIds} size={56} />
            <AttachmentThumbnails fileIds={existingAfterPhotoIds} size={56} />
          </View>
        )}
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
  durationHint: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.textMute,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    color: Colors.textMute,
    marginBottom: 6,
  },
  existingPhotos: { marginBottom: 10 },
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
