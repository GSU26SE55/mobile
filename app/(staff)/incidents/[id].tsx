import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '@/src/lib/theme';
import { handleErrorApi } from '@/src/lib/errors';
import { useIncident } from '@/src/features/incidents/hooks/useIncident';
import { useAcknowledgeIncident } from '@/src/features/incidents/hooks/useAcknowledgeIncident';
import { useResolveIncident } from '@/src/features/incidents/hooks/useResolveIncident';
import { IncidentStatusBadge } from '@/src/features/incidents/components/IncidentStatusBadge';
import {
  EnvironmentalIncidentStatusEnum,
  INCIDENT_TYPE_LABEL,
} from '@/src/features/incidents/types/incident.types';
import { resolveIncidentSchema } from '@/src/features/incidents/schemas/resolveIncident.schema';
import { AlertSeverityEnum } from '@/src/shared/enums/alert.enum';

const SEVERITY_STYLE: Record<AlertSeverityEnum, { label: string; color: string; bg: string }> = {
  [AlertSeverityEnum.Info]: { label: 'Info', color: Colors.info, bg: Colors.infoLight },
  [AlertSeverityEnum.Warning]: { label: 'Warning', color: Colors.warningDark, bg: Colors.warningLight },
  [AlertSeverityEnum.Critical]: { label: 'Critical', color: Colors.danger, bg: Colors.dangerLight },
};

export default function StaffIncidentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: incident, isLoading, isError } = useIncident(id ?? '');
  const { mutateAsync: acknowledge, isPending: ackPending } = useAcknowledgeIncident();
  const { mutateAsync: resolve, isPending: resolvePending } = useResolveIncident();

  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !incident) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={32} color={Colors.textFaint} />
        <Text style={styles.notFound}>Không tìm thấy sự cố</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const sev = SEVERITY_STYLE[incident.severity] ?? SEVERITY_STYLE[AlertSeverityEnum.Info];
  const canAck = incident.status === EnvironmentalIncidentStatusEnum.Open;
  const canResolve =
    incident.status === EnvironmentalIncidentStatusEnum.Open ||
    incident.status === EnvironmentalIncidentStatusEnum.Acknowledged;

  const handleAcknowledge = async () => {
    try {
      await acknowledge(incident.id);
      Alert.alert('Thành công', 'Đã xác nhận sự cố này.');
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const submitResolve = async () => {
    const parsed = resolveIncidentSchema.safeParse({ resolutionNote: note });
    if (!parsed.success) {
      setNoteError(parsed.error.issues[0]?.message ?? 'Ghi chú không hợp lệ');
      return;
    }
    setNoteError(null);
    try {
      await resolve({ id: incident.id, payload: parsed.data });
      setModalOpen(false);
      setNote('');
      Alert.alert('Thành công', 'Đã xử lý sự cố này.');
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết sự cố</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, Shadow]}>
          <View style={styles.pillRow}>
            <View style={[styles.sevPill, { backgroundColor: sev.bg }]}>
              <Text style={[styles.sevText, { color: sev.color }]}>{sev.label}</Text>
            </View>
            <IncidentStatusBadge status={incident.status} />
          </View>
          <Text style={styles.title}>{INCIDENT_TYPE_LABEL[incident.incidentType] ?? 'Sự cố'}</Text>
        </View>

        <View style={[styles.card, Shadow]}>
          <Row label="Phát hiện lúc" value={new Date(incident.detectedAt).toLocaleString()} />
          {incident.reportedBy ? (
            <>
              <Divider />
              <Row label="Báo cáo bởi" value={incident.reportedBy} />
            </>
          ) : null}
          {incident.acknowledgedAt ? (
            <>
              <Divider />
              <Row label="Xác nhận lúc" value={new Date(incident.acknowledgedAt).toLocaleString()} />
            </>
          ) : null}
          {incident.resolvedAt ? (
            <>
              <Divider />
              <Row label="Xử lý lúc" value={new Date(incident.resolvedAt).toLocaleString()} />
            </>
          ) : null}
          {incident.resolutionNote ? (
            <>
              <Divider />
              <Row label="Ghi chú xử lý" value={incident.resolutionNote} />
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Actions */}
      {(canAck || canResolve) && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {canAck && (
            <Pressable
              style={[styles.actionBtn, styles.ackBtn, Shadow]}
              onPress={handleAcknowledge}
              disabled={ackPending}
            >
              {ackPending ? (
                <ActivityIndicator size="small" color="#946011" />
              ) : (
                <Text style={[styles.actionText, { color: '#946011' }]}>Acknowledge</Text>
              )}
            </Pressable>
          )}
          {canResolve && (
            <Pressable
              style={[styles.actionBtn, styles.resolveBtn, Shadow]}
              onPress={() => setModalOpen(true)}
            >
              <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Resolve</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Resolve note modal */}
      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Xử lý sự cố</Text>
            <Text style={styles.modalLabel}>Ghi chú xử lý (5–2000 ký tự)</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="Mô tả cách xử lý sự cố…"
              placeholderTextColor={Colors.textFaint}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {noteError ? <Text style={styles.errorText}>{noteError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setModalOpen(false);
                  setNoteError(null);
                }}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={submitResolve}
                disabled={resolvePending}
              >
                {resolvePending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmText}>Xác nhận</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, gap: 10 },
  notFound: { fontSize: 16, fontWeight: '800', color: Colors.accent, marginTop: 8 },
  goBackBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  goBackText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  scroll: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: 18, marginBottom: 16 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sevPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  sevText: { fontSize: 11, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 13, color: Colors.textMute, fontWeight: '600' },
  rowValue: { fontSize: 13, fontWeight: '800', color: Colors.accent, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
  },
  ackBtn: { backgroundColor: '#FBE6C2' },
  resolveBtn: { backgroundColor: Colors.primary },
  actionText: { fontSize: 13, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.accent, marginBottom: 12 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMute, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 96,
    backgroundColor: Colors.bg,
  },
  errorText: { fontSize: 12, color: Colors.danger, marginTop: 6 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 12 },
  cancelBtn: { backgroundColor: Colors.bg2 },
  cancelText: { fontSize: 13, fontWeight: '800', color: Colors.textMute },
  confirmBtn: { backgroundColor: Colors.primary },
  confirmText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
});
