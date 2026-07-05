import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '../../../lib/theme';
import { BottomSheet } from '../../../shared/components/BottomSheet';

interface Props {
  visible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (resolutionSummary: string) => void;
}

export function ResolveModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = summary.trim();
    if (trimmed.length < 10) {
      setError('Mô tả kết quả cần ít nhất 10 ký tự');
      return;
    }
    onSubmit(trimmed);
  };

  const handleClose = () => {
    setSummary('');
    setError('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.body}>
        <Text style={styles.title}>Hoàn thành ticket</Text>
        <Text style={styles.desc}>Mô tả kết quả xử lý để Manager duyệt.</Text>

        <View>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={summary}
            onChangeText={(t) => { setSummary(t); setError(''); }}
            placeholder="Mô tả công việc đã thực hiện, kết quả..."
            placeholderTextColor={Colors.textFaint}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Hủy</Text>
          </Pressable>
          <Pressable
            style={[styles.submitBtn, isLoading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>Hoàn thành</Text>
            )}
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  desc: {
    fontSize: 13,
    color: Colors.textMute,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.card2,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.card2,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
