import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../../../lib/theme';
import { AlertSeverityEnum } from '../../../shared/enums/alert.enum';
import {
  EnvironmentalIncidentDto,
  EnvironmentalIncidentTypeEnum,
  INCIDENT_TYPE_LABEL,
} from '../types/incident.types';
import { IncidentStatusBadge } from './IncidentStatusBadge';

const SEVERITY_COLORS: Record<AlertSeverityEnum, { bg: string; iconColor: string }> = {
  [AlertSeverityEnum.Critical]: { bg: '#FFEBEA', iconColor: '#DC4F3D' },
  [AlertSeverityEnum.Warning]: { bg: '#FFF3E3', iconColor: '#FFB703' },
  [AlertSeverityEnum.Info]: { bg: '#EBF3FF', iconColor: '#5081C7' },
};

const TYPE_ICON: Record<EnvironmentalIncidentTypeEnum, keyof typeof Ionicons.glyphMap> = {
  [EnvironmentalIncidentTypeEnum.Smoke]: 'cloud-outline',
  [EnvironmentalIncidentTypeEnum.FireDetected]: 'flame-outline',
  [EnvironmentalIncidentTypeEnum.GasLeak]: 'warning-outline',
  [EnvironmentalIncidentTypeEnum.Flood]: 'water-outline',
  [EnvironmentalIncidentTypeEnum.OverheatHazard]: 'thermometer-outline',
  [EnvironmentalIncidentTypeEnum.Other]: 'alert-circle-outline',
};

export function IncidentCard({
  incident,
  siteName,
  onPress,
}: {
  incident: EnvironmentalIncidentDto;
  siteName?: string;
  onPress: () => void;
}) {
  const sev = SEVERITY_COLORS[incident.severity] ?? SEVERITY_COLORS[AlertSeverityEnum.Info];
  const icon = TYPE_ICON[incident.incidentType] ?? 'alert-circle-outline';

  return (
    <Pressable style={[styles.card, Shadow]} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: sev.bg }]}>
        <Ionicons name={icon} size={20} color={sev.iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{INCIDENT_TYPE_LABEL[incident.incidentType] ?? 'Sự cố'}</Text>
        {siteName ? <Text style={styles.meta}>{siteName}</Text> : null}
        <Text style={styles.time}>{new Date(incident.detectedAt).toLocaleString()}</Text>
      </View>
      <View style={styles.right}>
        <IncidentStatusBadge status={incident.status} />
        <Ionicons name="chevron-forward" size={14} color={Colors.textMute} style={{ marginTop: 6 }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', color: Colors.text },
  meta: { fontSize: 11, color: Colors.textMute, marginTop: 3 },
  time: { fontSize: 10, color: Colors.textFaint, marginTop: 3 },
  right: { alignItems: 'flex-end', marginLeft: 10 },
});
