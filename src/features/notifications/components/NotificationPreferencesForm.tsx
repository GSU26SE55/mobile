import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, CommonStyles, Radius, Shadow, Spacing } from '../../../lib/theme';
import { handleErrorApi } from '../../../lib/errors';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { notificationPreferenceSchema } from '../schemas/notificationPreference.schema';
import { UpdateNotificationPreferencePayload } from '../types/notification-preference.types';

interface ToggleRowProps {
  label: string;
  desc?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

function ToggleRow({ label, desc, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.graySoft, true: Colors.primary }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

export function NotificationPreferencesForm() {
  const { pref, updatePref } = useNotificationPreferences();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [timeZone, setTimeZone] = useState('Asia/Ho_Chi_Minh');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load flow — fill form khi data về.
  useEffect(() => {
    const d = pref.data;
    if (!d) return;
    setPushEnabled(d.pushEnabled);
    setEmailEnabled(d.emailEnabled);
    setSmsEnabled(d.smsEnabled);
    setInAppEnabled(d.inAppEnabled);
    const hasQuiet = d.quietHoursStart != null && d.quietHoursEnd != null;
    setQuietEnabled(hasQuiet);
    if (d.quietHoursStart) setQuietStart(d.quietHoursStart);
    if (d.quietHoursEnd) setQuietEnd(d.quietHoursEnd);
    setTimeZone(d.timeZone);
  }, [pref.data]);

  if (pref.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (pref.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorMsg}>Không tải được cài đặt thông báo.</Text>
        <Pressable style={CommonStyles.btnOutline} onPress={() => pref.refetch()}>
          <Text style={CommonStyles.btnOutlineText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const setFieldError = (field: string, message: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: message }));

  const handleSave = async () => {
    setFieldErrors({});
    const payload: UpdateNotificationPreferencePayload = {
      pushEnabled,
      emailEnabled,
      smsEnabled,
      inAppEnabled,
      quietHoursStart: quietEnabled ? quietStart.trim() : null,
      quietHoursEnd: quietEnabled ? quietEnd.trim() : null,
      timeZone: timeZone.trim(),
    };

    const parsed = notificationPreferenceSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'form');
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    try {
      await updatePref.mutateAsync(parsed.data);
      Alert.alert('Thành công', 'Đã lưu cài đặt thông báo');
    } catch (error) {
      handleErrorApi({ error, setFieldError });
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.card, Shadow]}>
        <Text style={styles.cardTitle}>Kênh nhận thông báo</Text>
        <ToggleRow label="Push notification" desc="Thông báo đẩy trên thiết bị" value={pushEnabled} onValueChange={setPushEnabled} />
        <ToggleRow label="Email" value={emailEnabled} onValueChange={setEmailEnabled} />
        <ToggleRow label="SMS" value={smsEnabled} onValueChange={setSmsEnabled} />
        <ToggleRow label="Trong ứng dụng" desc="Hiển thị trong danh sách thông báo" value={inAppEnabled} onValueChange={setInAppEnabled} />
      </View>

      <View style={[styles.card, Shadow]}>
        <ToggleRow
          label="Giờ im lặng"
          desc="Không nhận thông báo trong khung giờ này"
          value={quietEnabled}
          onValueChange={setQuietEnabled}
        />
        {quietEnabled ? (
          <View style={styles.quietRow}>
            <View style={styles.quietField}>
              <Text style={CommonStyles.inputLabel}>Bắt đầu</Text>
              <TextInput
                style={[CommonStyles.input, !!fieldErrors.quietHoursStart && CommonStyles.inputError]}
                value={quietStart}
                onChangeText={setQuietStart}
                placeholder="22:00"
                placeholderTextColor={Colors.placeholder}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              {fieldErrors.quietHoursStart ? (
                <Text style={CommonStyles.errorText}>{fieldErrors.quietHoursStart}</Text>
              ) : null}
            </View>
            <View style={styles.quietField}>
              <Text style={CommonStyles.inputLabel}>Kết thúc</Text>
              <TextInput
                style={[CommonStyles.input, !!fieldErrors.quietHoursEnd && CommonStyles.inputError]}
                value={quietEnd}
                onChangeText={setQuietEnd}
                placeholder="07:00"
                placeholderTextColor={Colors.placeholder}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              {fieldErrors.quietHoursEnd ? (
                <Text style={CommonStyles.errorText}>{fieldErrors.quietHoursEnd}</Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, Shadow]}>
        <Text style={CommonStyles.inputLabel}>Múi giờ</Text>
        <TextInput
          style={[CommonStyles.input, !!fieldErrors.timeZone && CommonStyles.inputError]}
          value={timeZone}
          onChangeText={setTimeZone}
          placeholder="Asia/Ho_Chi_Minh"
          placeholderTextColor={Colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {fieldErrors.timeZone ? (
          <Text style={CommonStyles.errorText}>{fieldErrors.timeZone}</Text>
        ) : null}
      </View>

      <Pressable
        style={[CommonStyles.btnPrimary, updatePref.isPending && CommonStyles.btnDisabled]}
        onPress={handleSave}
        disabled={updatePref.isPending}
      >
        {updatePref.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={CommonStyles.btnPrimaryText}>Lưu cài đặt</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, gap: Spacing.lg, padding: Spacing.xl },
  errorMsg: { color: Colors.textMute, fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.xs },
  cardTitle: { fontSize: 13, fontWeight: '600', color: Colors.textMute, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rowText: { flex: 1, paddingRight: Spacing.md },
  rowLabel: { fontSize: 15, color: Colors.text },
  rowDesc: { fontSize: 12, color: Colors.textMute, marginTop: 2 },
  quietRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  quietField: { flex: 1 },
});
