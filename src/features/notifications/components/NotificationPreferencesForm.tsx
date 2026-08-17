import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, CommonStyles, Radius, Shadow, Spacing } from '@/src/lib/theme';
import { handleErrorApi } from '@/src/lib/errors';
import { CategoryMatrixTable } from './CategoryMatrixTable';
import { useNotificationMatrix } from '../hooks/useNotificationMatrix';
import { useUpdateNotificationPreference } from '../hooks/useNotificationPreferences';
import { notificationPreferenceSchema } from '../schemas/notificationPreference.schema';
import { UpdateNotificationPreferencePayload } from '../types/notification-preference.types';
import { openNotificationSettings } from '../../../lib/notifications';

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
  // GH-83 — the data source is `GET /matrix` (returns both `channels` and `categories`) instead of
  // `GET /notification-preferences`. One source per piece of data; two sources is a guaranteed way to drift.
  // Writes still go through `PUT /notification-preferences` because `PUT /matrix` only accepts `items` (category rows).
  const { matrix: pref } = useNotificationMatrix();
  const updatePref = useUpdateNotificationPreference();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  // Fixed for this deployment — no VN-only user needs to change it, so no UI is exposed.
  const timeZone = 'Asia/Ho_Chi_Minh';
  // GH-83 — 3 chat options (#570). Previously mobile didn't declare these, so every Save had BE overwrite them with defaults.
  const [notifyOnChat, setNotifyOnChat] = useState(true);
  const [notifyOnMention, setNotifyOnMention] = useState(true);
  const [notifyOnReaction, setNotifyOnReaction] = useState(false);
  // Pass-through: keep the value BE returns as-is, mobile has no Frequency UI yet.
  const [digestWindowMinutes, setDigestWindowMinutes] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load flow — fill the form once data arrives.
  useEffect(() => {
    // `/matrix` wraps the global toggle in `channels`; the `categories` part is handled by CategoryMatrixTable.
    const d = pref.data?.channels;
    if (!d) return;
    setPushEnabled(d.pushEnabled);
    setEmailEnabled(d.emailEnabled);
    setSmsEnabled(d.smsEnabled);
    setInAppEnabled(d.inAppEnabled);
    const hasQuiet = d.quietHoursStart != null && d.quietHoursEnd != null;
    setQuietEnabled(hasQuiet);
    if (d.quietHoursStart) setQuietStart(d.quietHoursStart);
    if (d.quietHoursEnd) setQuietEnd(d.quietHoursEnd);
    setNotifyOnChat(d.notifyOnChat);
    setNotifyOnMention(d.notifyOnMention);
    setNotifyOnReaction(d.notifyOnReaction);
    setDigestWindowMinutes(d.digestWindowMinutes);
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
        <Text style={styles.errorMsg}>Could not load notification settings.</Text>
        <Pressable style={CommonStyles.btnOutline} onPress={() => pref.refetch()}>
          <Text style={CommonStyles.btnOutlineText}>Retry</Text>
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
      notifyOnChat,
      notifyOnMention,
      notifyOnReaction,
      digestWindowMinutes,
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
      Alert.alert('Success', 'Notification settings saved');
    } catch (error) {
      handleErrorApi({ error, setFieldError });
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.card, Shadow]}>
        <Text style={styles.cardTitle}>Notification Channels</Text>
        <ToggleRow label="Push notification" desc="Push notification on device" value={pushEnabled} onValueChange={setPushEnabled} />
        <ToggleRow label="Email" value={emailEnabled} onValueChange={setEmailEnabled} />
        <ToggleRow label="SMS" value={smsEnabled} onValueChange={setSmsEnabled} />
        <ToggleRow label="In-app" desc="Show in the notification list" value={inAppEnabled} onValueChange={setInAppEnabled} />
      </View>

      {Platform.OS === 'android' ? (
        <View style={[styles.card, Shadow]}>
          <Text style={styles.cardTitle}>Chat Bubbles</Text>
          <Text style={styles.rowDesc}>
            Allow ticket messages to appear outside the app as a floating conversation.
          </Text>
          <Pressable style={CommonStyles.btnOutline} onPress={() => void openNotificationSettings()}>
            <Text style={CommonStyles.btnOutlineText}>Open Android Settings</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.card, Shadow]}>
        <Text style={styles.cardTitle}>Ticket Conversation</Text>
        <ToggleRow
          label="New comment"
          desc="Someone commented on your ticket"
          value={notifyOnChat}
          onValueChange={setNotifyOnChat}
        />
        <ToggleRow
          label="When mentioned"
          desc="Someone @mentioned you in a comment"
          value={notifyOnMention}
          onValueChange={setNotifyOnMention}
        />
        <ToggleRow
          label="Comment reactions"
          desc="Someone reacted to your comment"
          value={notifyOnReaction}
          onValueChange={setNotifyOnReaction}
        />
      </View>

      {/* Category × channel matrix — saves immediately on tapping a cell (PUT /matrix), independent of the
          Save button below (that button is only for the global toggle via PUT /notification-preferences). */}
      <CategoryMatrixTable />

      <View style={[styles.card, Shadow]}>
        <ToggleRow
          label="Quiet Hours"
          desc="Don't receive notifications during this time window"
          value={quietEnabled}
          onValueChange={setQuietEnabled}
        />
        {quietEnabled ? (
          <View style={styles.quietRow}>
            <View style={styles.quietField}>
              <Text style={CommonStyles.inputLabel}>Start</Text>
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
              <Text style={CommonStyles.inputLabel}>End</Text>
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

      <Pressable
        style={[CommonStyles.btnPrimary, updatePref.isPending && CommonStyles.btnDisabled]}
        onPress={handleSave}
        disabled={updatePref.isPending}
      >
        {updatePref.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={CommonStyles.btnPrimaryText}>Save Settings</Text>
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
