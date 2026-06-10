import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Shadow, ShadowPrimary } from '../../../lib/theme';
import { ChangePasswordInput, changePasswordSchema } from '../schemas/changePassword.schema';

interface Props {
  onSubmit: (data: ChangePasswordInput) => void;
  isLoading?: boolean;
  fieldErrors?: Record<string, string>;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  visible: boolean;
  onToggleVisible: () => void;
}

function PasswordField({ label, value, onChange, error, placeholder, visible, onToggleVisible }: FieldProps) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.inputRow, error && fieldStyles.inputRowError]}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!visible}
          placeholder={placeholder ?? '••••••••'}
          placeholderTextColor={Colors.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={onToggleVisible} hitSlop={10} style={fieldStyles.eyeBtn}>
          <Ionicons
            name={visible ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={Colors.textMute}
          />
        </Pressable>
      </View>
      {error ? <Text style={fieldStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMute, marginBottom: 8, marginTop: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
  },
  inputRowError: { borderColor: Colors.danger },
  input: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 13 },
  eyeBtn: { paddingLeft: 8 },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: 5 },
});

export function ChangePasswordForm({ onSubmit, isLoading, fieldErrors }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const getError = (field: string) => localErrors[field] ?? fieldErrors?.[field];

  const handleSubmit = () => {
    setLocalErrors({});
    const result = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) errs[k] = v[0];
      });
      setLocalErrors(errs);
      return;
    }
    onSubmit(result.data);
  };

  return (
    <View style={styles.container}>      
      {/* Fields */}
      <View style={[styles.fieldsCard, Shadow]}>
        <PasswordField
          label="Mật khẩu hiện tại"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={getError('currentPassword')}
          visible={showCurrent}
          onToggleVisible={() => setShowCurrent((v) => !v)}
        />

        <View style={styles.divider} />

        <PasswordField
          label="Mật khẩu mới"
          value={newPassword}
          onChange={setNewPassword}
          error={getError('newPassword')}
          visible={showNew}
          onToggleVisible={() => setShowNew((v) => !v)}
        />

        <View style={styles.divider} />

        <PasswordField
          label="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={getError('confirmPassword')}
          visible={showConfirm}
          onToggleVisible={() => setShowConfirm((v) => !v)}
        />
      </View>

      {/* Submit */}
      <Pressable
        style={[styles.button, isLoading && styles.btnDisabled, ShadowPrimary]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Xác nhận đổi mật khẩu</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  headerSub: { fontSize: 12, color: Colors.textMute, lineHeight: 17 },
  fieldsCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginTop: 12 },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
