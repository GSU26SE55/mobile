import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  EnvironmentalIncidentStatusEnum,
  INCIDENT_STATUS_LABEL,
} from '../types/incident.types';

// ⚠️ SEPARATE badge for incident — do NOT reuse the alert badge (Resolved has a different value: 3 vs 4).
const STATUS_COLORS: Record<EnvironmentalIncidentStatusEnum, { bg: string; text: string }> = {
  [EnvironmentalIncidentStatusEnum.Open]: { bg: '#FAD9D2', text: '#B73221' },
  [EnvironmentalIncidentStatusEnum.Acknowledged]: { bg: '#FBE6C2', text: '#946011' },
  [EnvironmentalIncidentStatusEnum.Resolved]: { bg: '#DCEEDC', text: '#2F7A2F' },
  [EnvironmentalIncidentStatusEnum.FalseAlarm]: { bg: '#F5F2EC', text: '#7A7872' },
};

export function IncidentStatusBadge({
  status,
}: {
  status: EnvironmentalIncidentStatusEnum;
}) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS[EnvironmentalIncidentStatusEnum.Open];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>
        {INCIDENT_STATUS_LABEL[status] ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
});
