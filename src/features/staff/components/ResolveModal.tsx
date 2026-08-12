import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { BottomSheet } from '@/src/shared/components/BottomSheet';
import { handleErrorApi } from '@/src/lib/errors';

interface Props {
  visible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (resolutionSummary: string) => Promise<void>;
}

export function ResolveModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = summary.trim();
    if (trimmed.length < 10) {
      setError('Resolution summary must be at least 10 characters');
      return;
    }
    try {
      await onSubmit(trimmed);
    } catch (err) {
      handleErrorApi({
        error: err,
        setFieldError: (field, message) => {
          if (field === 'resolutionSummary') setError(message);
        },
      });
    }
  };

  const handleClose = () => {
    setSummary('');
    setError('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.body}>
        <Text style={styles.title}>Complete ticket</Text>
        <Text style={styles.desc}>Describe the resolution for the Manager to review.</Text>

        <View>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={summary}
            onChangeText={(t) => { setSummary(t); setError(''); }}
            placeholder="Describe the work performed and the outcome..."
            placeholderTextColor={Colors.textFaint}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.submitBtn, isLoading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>Complete</Text>
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
