import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { useReadingEvidence, toWarningRows } from '../hooks/useReadingEvidence';

/** Number of rows shown by default before tapping "Load more". */
const PREVIEW_ROWS = 10;
/** Number of rows revealed per "Load more" tap. */
const LOAD_MORE_STEP = 25;

const num = (v: number | null | undefined, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : '—';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

interface Props {
  batteryAssetId?: string | null;
  /** Incident detection timestamp — anchor for fetching the evidence log (±15'). */
  detectedAt?: string | null;
}

/**
 * Alert evidence — shows ONLY readings that breached thresholds around the incident
 * detection time (DetectedAt ±15'), NOT a real-time log. Lets Staff/Manager verify
 * whether a ticket is genuine. Mobile counterpart of the web `BatteryWarningEvidencePanel`
 * — keeps the same columns and thresholds so both platforms don't show two different
 * sets of numbers for the same ticket.
 *
 * Horizontally scrolling table: 6 numeric columns don't fit a phone's width; forcing
 * them to fit would squeeze the text unreadable.
 */
export function BatteryWarningEvidencePanel({ batteryAssetId, detectedAt }: Props) {
  const { data, isLoading } = useReadingEvidence(batteryAssetId, detectedAt);
  const warnings = toWarningRows(data?.items ?? []);

  // A ±15' window at 5s frequency yields a few hundred rows — rendering all of them
  // would swallow the entire screen and push everything else down. Default 10 rows,
  // each "Load more" tap reveals 25 more.
  const [limit, setLimit] = useState(PREVIEW_ROWS);
  const visibleRows = warnings.slice(0, limit);
  const hiddenCount = warnings.length - visibleRows.length;

  // No battery or ticket has no detection timestamp → no evidence to show.
  if (!batteryAssetId || !detectedAt) return null;

  return (
    <View>
      <View style={styles.headRow}>
        <Ionicons name="shield-checkmark" size={15} color={Colors.warningDark} />
        <Text style={styles.headText}>ALERT EVIDENCE (AT DETECTION)</Text>
        {warnings.length > 0 && (
          <Text style={styles.headCount}>{warnings.length}</Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : warnings.length === 0 ? (
        <Text style={styles.empty}>No abnormal readings around the detection time.</Text>
      ) : (
        <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.theadRow}>
              <Text style={[styles.th, styles.colTime]}>Time</Text>
              <Text style={[styles.th, styles.colNum]}>V</Text>
              <Text style={[styles.th, styles.colNum]}>A</Text>
              <Text style={[styles.th, styles.colNum]}>°C</Text>
              <Text style={[styles.th, styles.colNum]}>SOC%</Text>
              <Text style={[styles.th, styles.colWarn]}>Alert</Text>
            </View>

            {visibleRows.map(({ reading: r, reasons }) => (
              <View key={r.time} style={styles.tr}>
                <Text style={[styles.td, styles.colTime, styles.tdMuted]}>{formatTime(r.time)}</Text>
                <Text style={[styles.td, styles.colNum]}>{num(r.voltage)}</Text>
                <Text style={[styles.td, styles.colNum]}>{num(r.current)}</Text>
                <Text style={[styles.td, styles.colNum, styles.tdHot]}>{num(r.temperature, 1)}</Text>
                <Text style={[styles.td, styles.colNum]}>{num(r.socPercent, 1)}</Text>
                <View style={[styles.colWarn, styles.warnCell]}>
                  {reasons.map((reason) => (
                    <View key={reason} style={styles.chip}>
                      <Text style={styles.chipText}>{reason}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Button sits OUTSIDE the horizontal ScrollView — inside, it would drift along
            the horizontal axis and disappear from view while the user is looking at the
            "Alert" column. */}
        {hiddenCount > 0 && (
          <Pressable
            style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.6 }]}
            onPress={() => setLimit((v) => v + LOAD_MORE_STEP)}
          >
            <Text style={styles.moreText}>
              Load {Math.min(LOAD_MORE_STEP, hiddenCount)} more rows
            </Text>
            <Text style={styles.moreCount}>{hiddenCount} left</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.primaryDark} />
          </Pressable>
        )}

        {/* Once fully expanded, allow collapsing back if the list is long — saves scrolling back up. */}
        {hiddenCount === 0 && warnings.length > PREVIEW_ROWS && (
          <Pressable
            style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.6 }]}
            onPress={() => setLimit(PREVIEW_ROWS)}
          >
            <Text style={styles.moreText}>Collapse</Text>
            <Ionicons name="chevron-up" size={14} color={Colors.primaryDark} />
          </Pressable>
        )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  headText: { fontSize: 11, fontWeight: '800', color: Colors.textMute, letterSpacing: 0.4 },
  headCount: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.warningDark,
    backgroundColor: Colors.warningLight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },

  center: { paddingVertical: 20, alignItems: 'center' },
  empty: { fontSize: 12, color: Colors.textMute, textAlign: 'center', paddingVertical: 14 },

  table: {
    borderWidth: 1,
    borderColor: Colors.warningLight,
    borderRadius: 10,
    overflow: 'hidden',
  },
  theadRow: {
    flexDirection: 'row',
    backgroundColor: Colors.warningLight,
    paddingVertical: 7,
  },
  th: { fontSize: 11, fontWeight: '700', color: Colors.textMute },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: Colors.warningLight,
  },
  td: { fontSize: 12, color: Colors.text, fontVariant: ['tabular-nums'] },
  tdMuted: { color: Colors.textMute },
  tdHot: { color: Colors.warningDark, fontWeight: '700' },

  colTime: { width: 116, paddingHorizontal: 8 },
  colNum: { width: 58, paddingHorizontal: 8, textAlign: 'right' },
  colWarn: { width: 150, paddingHorizontal: 8 },
  warnCell: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  chip: {
    backgroundColor: Colors.warningLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: { fontSize: 10, fontWeight: '700', color: Colors.warningDark },

  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  moreText: { fontSize: 12, fontWeight: '800', color: Colors.primaryDark },
  moreCount: { fontSize: 11, fontWeight: '600', color: Colors.textMute },
});
