import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Shadow } from '../../../lib/theme';
import { AttachmentPicker, UploadedAttachment } from '../../file-storage/components/AttachmentPicker';
import { FilePurposeEnum } from '../../file-storage/enums/file-storage.enum';
import type { MaintenanceLogPayload } from '../types/staff.types';

interface Props {
  isLoading: boolean;
  onSubmit: (data: MaintenanceLogPayload) => void;
  // GH-44 — tái dùng cho sửa log (PATCH): prefill các field text. Ảnh không prefill (PATCH partial — bỏ trống = giữ nguyên).
  initialValues?: Pick<MaintenanceLogPayload, 'summary' | 'actionsTaken' | 'partsUsed' | 'durationMinutes'>;
  title?: string;
  submitLabel?: string;
}

export function MaintenanceLogForm({ isLoading, onSubmit, initialValues, title, submitLabel }: Props) {
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

  const handleSubmit = () => {
    const trimmed = description.trim();
    if (trimmed.length < 5) {
      setError('Mô tả cần ít nhất 5 ký tự');
      return;
    }
    onSubmit({
      summary: trimmed,
      actionsTaken: actionTaken.trim() || undefined,
      partsUsed: partsUsed.trim() || undefined,
      durationMinutes: duration ? parseInt(duration, 10) : undefined,
      beforePhotos: beforePhotos.length > 0 ? beforePhotos : undefined,
      afterPhotos: afterPhotos.length > 0 ? afterPhotos : undefined,
    });
    setDescription('');
    setActionTaken('');
    setPartsUsed('');
    setDuration('');
    setBeforePhotos([]);
    setAfterPhotos([]);
    setError('');
  };

  return (
    <View style={[styles.container, Shadow]}>
      <Text style={styles.title}>{title ?? 'Ghi nhật ký bảo trì'}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Mô tả công việc *</Text>
        <TextInput
          style={[styles.input, styles.inputLarge, error ? styles.inputError : null]}
          value={description}
          onChangeText={(t) => { setDescription(t); setError(''); }}
          placeholder="Mô tả việc đã làm..."
          placeholderTextColor={Colors.textFaint}
          multiline
          textAlignVertical="top"
          maxLength={1000}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Hành động đã thực hiện</Text>
        <TextInput
          style={styles.input}
          value={actionTaken}
          onChangeText={setActionTaken}
          placeholder="VD: Thay module inverter, vệ sinh kết nối..."
          placeholderTextColor={Colors.textFaint}
          maxLength={500}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Linh kiện sử dụng</Text>
          <TextInput
            style={styles.input}
            value={partsUsed}
            onChangeText={setPartsUsed}
            placeholder="VD: Module XYZ"
            placeholderTextColor={Colors.textFaint}
            maxLength={200}
          />
        </View>
        <View style={[styles.field, { width: 100 }]}>
          <Text style={styles.label}>Thời gian (phút)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="30"
            placeholderTextColor={Colors.textFaint}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Ảnh trước / sau khi xử lý</Text>
        <AttachmentPicker
          purpose={FilePurposeEnum.MaintenancePhoto}
          value={beforePhotos}
          onChange={setBeforePhotos}
          onUploadingChange={setUploadingBefore}
          label="Ảnh trước"
        />
        <AttachmentPicker
          purpose={FilePurposeEnum.MaintenancePhoto}
          value={afterPhotos}
          onChange={setAfterPhotos}
          onUploadingChange={setUploadingAfter}
          label="Ảnh sau"
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
          <Text style={styles.submitText}>{submitLabel ?? 'Lưu nhật ký'}</Text>
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
