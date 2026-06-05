import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SlaTimerDTO } from '../types/ticket.types';

interface Props {
  sla: SlaTimerDTO;
}

function formatDueAt(dueAt: string): string {
  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return 'Đã quá hạn';
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffM = Math.floor((diffMs % 3_600_000) / 60_000);
  if (diffH > 0) return `Còn ${diffH}h ${diffM}m`;
  return `Còn ${diffM}m`;
}

export function SlaCountdown({ sla }: Props) {
  const isBreached = sla.status === 'Breached';
  const isPaused   = sla.status === 'Paused';
  const isMet      = sla.status === 'Met';

  const barColor = isBreached
    ? '#E53935'
    : sla.remainingPercent <= 20
      ? '#FB8C00'
      : '#43A047';

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>SLA</Text>
        <Text style={[styles.status, isBreached && styles.breached]}>
          {isBreached ? 'Vi phạm SLA' : isPaused ? 'Tạm dừng' : isMet ? 'Đúng hạn' : formatDueAt(sla.dueAt)}
        </Text>
      </View>
      {!isMet && (
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.max(0, sla.remainingPercent)}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:     { fontSize: 12, color: '#666' },
  status:    { fontSize: 12, fontWeight: '600', color: '#333' },
  breached:  { color: '#E53935' },
  barBg:     { height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, overflow: 'hidden' },
  barFill:   { height: 4, borderRadius: 2 },
});
