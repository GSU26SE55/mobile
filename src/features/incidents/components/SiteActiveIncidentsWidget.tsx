import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/src/lib/theme';
import { useSiteActiveIncidents } from '../hooks/useSiteActiveIncidents';
import { IncidentStatusBadge } from './IncidentStatusBadge';
import { INCIDENT_TYPE_LABEL } from '../types/incident.types';

interface Props {
  siteId: string | undefined;
  /** Điều hướng theo app (customer vs staff route khác nhau). */
  onPressIncident: (id: string) => void;
}

// GH-68 — widget "Sự cố đang xảy ra" (Open+Acknowledged) trên site detail. Ẩn khi rỗng.
export function SiteActiveIncidentsWidget({ siteId, onPressIncident }: Props) {
  const { data: incidents = [] } = useSiteActiveIncidents(siteId);

  if (incidents.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="warning" size={16} color={Colors.danger} />
        <Text style={styles.title}>Sự cố đang xảy ra ({incidents.length})</Text>
      </View>
      {incidents.map((inc) => (
        <Pressable key={inc.id} style={styles.row} onPress={() => onPressIncident(inc.id)}>
          <View style={styles.rowMain}>
            <Text style={styles.rowType} numberOfLines={1}>
              {INCIDENT_TYPE_LABEL[inc.incidentType] ?? 'Sự cố'}
            </Text>
            <IncidentStatusBadge status={inc.status} />
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textFaint} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontWeight: '800', color: Colors.danger },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  rowType: { fontSize: 13, fontWeight: '600', color: Colors.text, flexShrink: 1 },
});
