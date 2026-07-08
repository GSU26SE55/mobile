import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../lib/theme';
import { SlaTimerDTO } from '../types/ticket.types';

interface Props {
  sla: SlaTimerDTO;
}

function formatDueAt(dueAt: string): string {
  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return 'Quá hạn';
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffM = Math.floor((diffMs % 3_600_000) / 60_000);
  if (diffH > 0) return `< ${diffH}h ${diffM}m`;
  return `< ${diffM}m`;
}

export function SlaCountdown({ sla }: Props) {
  const isBreached = sla.status === 'Breached';
  const isPaused   = sla.status === 'Paused';
  const isMet      = sla.status === 'Met';

  const isUrgent = isBreached || sla.remainingPercent <= 15;
  const isTight  = sla.remainingPercent <= 30;
  const color = isBreached ? Colors.danger : isUrgent ? Colors.danger : isTight ? Colors.warning : Colors.textMute;

  const label = isBreached
    ? 'SLA Vi phạm'
    : isPaused
      ? 'SLA Tạm dừng'
      : isMet
        ? 'Đúng hạn'
        : `SLA ${formatDueAt(sla.dueAt)}`;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="time-outline" size={12} color={color} />
        <Text style={[styles.label, { color, fontWeight: isUrgent || isBreached ? '700' : '600' }]}>{label}</Text>
      </View>
      {!isMet && (
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.max(0, Math.min(100, sla.remainingPercent))}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label:     { fontSize: 11 },
  barBg:     { height: 3, backgroundColor: Colors.card3, borderRadius: 2, overflow: 'hidden' },
  barFill:   { height: 3, borderRadius: 2 },
});
