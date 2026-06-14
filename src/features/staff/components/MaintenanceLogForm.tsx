import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Shadow } from '../../../lib/theme';
import type { MaintenanceLogPayload } from '../types/staff.types';

interface Props {
  isLoading: boolean;
  onSubmit: (data: MaintenanceLogPayload) => void;
}

export function MaintenanceLogForm({ isLoading, onSubmit }: Props) {
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [duration, setDuration] = useState('');
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
    });
    setDescription('');
    setActionTaken('');
    setPartsUsed('');
    setDuration('');
    setError('');
  };

  return (
    <View style={[styles.container, Shadow]}>
      <Text style={styles.title}>Ghi nhật ký bảo trì</Text>

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

      <Pressable
        style={[styles.submitBtn, isLoading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitText}>Lưu nhật ký</Text>
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
