import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDateShort, formatTimeSeconds } from '@/src/lib/date';
import { Colors } from '@/src/lib/theme';
import { useAmbientEvidence } from '../hooks/useAmbientEvidence';
import { useAmbientThreshold } from '../hooks/useAmbientThreshold';
import { evaluateAmbientRow, type AmbientLevel } from '../utils/ambientThresholds';

/** Number of rows shown by default before tapping "Load more". */
const PREVIEW_ROWS = 10;
/** Number of rows revealed per "Load more" tap. */
const LOAD_MORE_STEP = 25;

/** Mirrors web's `ambientLevelTextClass`: critical red, warning amber, otherwise plain. */
function levelStyle(level: AmbientLevel) {
  if (level === 'critical') return styles.tdCritical;
  if (level === 'warning') return styles.tdHot;
  return undefined;
}

const num = (v: number | null | undefined, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : '—';

// Giữ giây: ambient publish khoảng 1 lần/phút nhưng cùng phút vẫn có thể có 2 bản ghi.
// Bỏ năm: bảng chỉ trải trong ±2 phút quanh thời điểm phát hiện nên năm là thừa.
function formatEvidenceTime(iso: string): string {
  return `${formatDateShort(iso)} ${formatTimeSeconds(iso)}`;
}

interface Props {
  siteId?: string | null;
  /**
   * `evidence` (default) matches the battery panel exactly: with no threshold config
   * there is no basis to flag anything, so it says so instead of showing rows.
   *
   * `log` is for the site screen, where the reader asked for the readings themselves.
   * Rows render uncoloured rather than not at all — withholding the log because nobody
   * configured a limit would answer a different question than the one being asked.
   */
  mode?: 'evidence' | 'log';
  /**
   * Anchor for the ±2' window — the incident's `detectedAt` (when the condition was
   * observed), not `createdAt`, which on a manual report can trail the event by hours.
   */
  anchorAt?: string | null;
}

/**
 * Alert evidence for a SITE-level ticket — the ambient counterpart of
 * `BatteryWarningEvidencePanel`, and deliberately identical to it in shape: same
 * heading, same warning-toned table, same trigger-row highlight, same Load more /
 * Collapse control. Staff read both kinds of ticket in one session, so an ambient
 * ticket must not present its evidence in a different visual language.
 *
 * A site ticket used to show one parsed sensor line ("MQ-2 raw=3100 > thr=2000") and
 * nothing else, so a genuine event and a single stray sample looked the same.
 */
export function AmbientEvidencePanel({ siteId, anchorAt, mode = 'evidence' }: Props) {
  const { data, isLoading } = useAmbientEvidence(siteId, anchorAt);
  const { data: threshold, isLoading: isThresholdLoading } = useAmbientThreshold(siteId);

  // Readings arrive newest-first; an incident reads better oldest-first, as a build-up
  // toward the detection stamp rather than a countdown away from it.
  const rows = [...(data?.items ?? [])].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
  const evaluated = rows.map((r) => ({ reading: r, ev: evaluateAmbientRow(r, threshold) }));
  const breachCount = evaluated.filter(
    ({ ev }) => ev.worst === 'critical' || ev.worst === 'warning',
  ).length;

  const [limit, setLimit] = useState(PREVIEW_ROWS);
  const visibleRows = evaluated.slice(0, limit);
  const hiddenCount = evaluated.length - visibleRows.length;

  // No site or no detection timestamp → no evidence to show.
  if (!siteId || !anchorAt) return null;

  return (
    <View>
      <View style={styles.headRow}>
        <Ionicons name="shield-checkmark" size={15} color={Colors.warningDark} />
        <Text style={styles.headText}>
          {mode === 'log' ? 'SITE LOG (AT DETECTION)' : 'ALERT EVIDENCE (AT DETECTION)'}
        </Text>
        {breachCount > 0 && <Text style={styles.headCount}>{breachCount}</Text>}
      </View>

      {isLoading || isThresholdLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : mode === 'evidence' && !threshold?.enabled ? (
        // No config for this site → the backend has no limits to enforce either. Say so
        // plainly instead of rendering rows judged against thresholds we invented.
        <Text style={styles.empty}>
          This site has no ambient threshold config — no basis to flag readings.
        </Text>
      ) : evaluated.length === 0 ? (
        <Text style={styles.empty}>No ambient readings around the detection time.</Text>
      ) : (
        <>
          {mode === 'log' && !threshold?.enabled && (
            <Text style={styles.contextNote}>
              No ambient thresholds configured for this site — readings are shown unflagged.
            </Text>
          )}
          {breachCount === 0 && threshold?.enabled && (
            // Có số đo nhưng không dòng nào vượt ngưỡng. Nói thẳng ra thay vì để bảng tự nói —
            // đây chính là căn cứ để bác một ticket khai khống.
            <Text style={styles.contextNote}>
              No reading breached the configured limits — the rows below are the sensor context
              around the reported time.
            </Text>
          )}
          <View style={styles.table}>
            <View style={styles.theadRow}>
              <Text style={[styles.th, styles.colTime]}>Time</Text>
              <Text style={[styles.th, styles.colNum]}>°C</Text>
              <Text style={[styles.th, styles.colNum]}>RH%</Text>
              <Text style={[styles.th, styles.colNum]}>W/m²</Text>
            </View>

            {visibleRows.map(({ reading: r, ev }) => {
              // The reading stamped at the detection time is the one that tipped the
              // counter. Marking it separates cause from surrounding context.
              const isTrigger =
                new Date(r.time).getTime() === new Date(anchorAt).getTime();
              const isCritical = ev.worst === 'critical';
              const isWarning = ev.worst === 'warning';

              return (
                <View
                  key={r.time}
                  style={[
                    styles.tr,
                    isWarning && styles.trWarning,
                    isCritical && styles.trCritical,
                    isTrigger && styles.trTrigger,
                  ]}
                >
                  <Text style={[styles.td, styles.colTime, styles.tdMuted]}>
                    {formatEvidenceTime(r.time)}
                  </Text>
                  <Text style={[styles.td, styles.colNum, levelStyle(ev.temperature)]}>
                    {num(r.ambientTemperature, 1)}
                  </Text>
                  <Text style={[styles.td, styles.colNum, levelStyle(ev.humidity)]}>
                    {num(r.humidity, 1)}
                  </Text>
                  <Text style={[styles.td, styles.colNum]}>{num(r.solarIrradiance, 0)}</Text>
                </View>
              );
            })}
          </View>

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

          {hiddenCount === 0 && evaluated.length > PREVIEW_ROWS && (
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
    paddingVertical: 10,
  },
  th: { fontSize: 11, fontWeight: '700', color: Colors.textMute },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: Colors.warningLight,
  },
  trWarning: { backgroundColor: Colors.warningLight + '55' },
  trCritical: { backgroundColor: Colors.dangerLight },
  trTrigger: { backgroundColor: Colors.warningLight },
  contextNote: { fontSize: 11, color: Colors.textMute, paddingHorizontal: 2, paddingBottom: 6 },
  td: { fontSize: 12, color: Colors.text, fontVariant: ['tabular-nums'] },
  tdMuted: { color: Colors.textMute },
  tdHot: { color: Colors.warningDark, fontWeight: '700' },
  tdCritical: { color: Colors.dangerDark, fontWeight: '700' },

  colTime: { flex: 1.5, paddingHorizontal: 10 },
  colNum: { flex: 1, paddingHorizontal: 10, textAlign: 'right' },

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
