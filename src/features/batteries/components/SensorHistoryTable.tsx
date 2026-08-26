import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateShort, formatTimeSeconds } from '@/src/lib/date';
import { Colors, Solar } from '@/src/lib/theme';
import { useSensorReadingHistory } from '../hooks/useSensorReadingHistory';
import type { SensorReadingDto } from '../types/sensor-reading.types';

/**
 * Raw sensor log for a time window — mobile counterpart of web's "Sensor history"
 * tab. Unlike `BatteryWarningEvidencePanel`, this filters nothing: it is the full
 * reading stream, which is what "View real-time detail" promises.
 *
 * Horizontally scrolling, same as the evidence table: five numeric columns plus a
 * timestamp do not fit a phone width, and squeezing them makes the digits
 * unreadable.
 */

const PREVIEW_ROWS = 15;
const LOAD_MORE_STEP = 25;

const num = (v: number | null | undefined, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : '—';

interface Props {
  assetId: string;
  /** ISO window. Omit both for the most recent readings. */
  from?: string;
  to?: string;
}

export function SensorHistoryTable({ assetId, from, to }: Props) {
  const [visible, setVisible] = useState(PREVIEW_ROWS);
  const { data, isLoading, isError } = useSensorReadingHistory(assetId, {
    from,
    to,
    limit: 200,
  });

  const items: SensorReadingDto[] = data?.items ?? [];
  const shown = items.slice(0, visible);
  const remaining = items.length - shown.length;

  const windowLabel =
    from && to
      ? `${formatDateShort(from)} ${formatTimeSeconds(from)} — ${formatTimeSeconds(to)}`
      : 'Most recent readings';

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Ionicons name="pulse-outline" size={15} color={Solar.yellowDeep} />
        <Text style={styles.title}>Sensor history</Text>
        {items.length > 0 && <Text style={styles.count}>{items.length}</Text>}
      </View>
      <Text style={styles.window}>{windowLabel}</Text>

      {isLoading ? (
        <ActivityIndicator color={Solar.yellowDeep} style={styles.state} />
      ) : isError ? (
        <Text style={styles.state}>Unable to load sensor history</Text>
      ) : items.length === 0 ? (
        <Text style={styles.state}>No readings in this window</Text>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.cell, styles.timeCell, styles.headerCell]}>Time</Text>
                <Text style={[styles.cell, styles.headerCell]}>V</Text>
                <Text style={[styles.cell, styles.headerCell]}>A</Text>
                <Text style={[styles.cell, styles.headerCell]}>°C</Text>
                <Text style={[styles.cell, styles.headerCell]}>SOC%</Text>
              </View>

              {shown.map((r, i) => (
                <View
                  key={`${r.time}-${i}`}
                  style={[styles.row, i % 2 === 1 && styles.rowAlt]}
                >
                  <Text style={[styles.cell, styles.timeCell]}>
                    {formatDateShort(r.time)} {formatTimeSeconds(r.time)}
                  </Text>
                  <Text style={styles.cell}>{num(r.voltage)}</Text>
                  <Text style={styles.cell}>{num(r.current)}</Text>
                  <Text style={styles.cell}>{num(r.temperature, 1)}</Text>
                  <Text style={styles.cell}>{num(r.socPercent, 1)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {remaining > 0 && (
            <Pressable
              style={styles.moreBtn}
              onPress={() => setVisible((v) => v + LOAD_MORE_STEP)}
            >
              <Text style={styles.moreText}>Show {Math.min(remaining, LOAD_MORE_STEP)} more rows</Text>
              <Ionicons name="chevron-down" size={14} color={Solar.yellowDeep} />
            </Pressable>
          )}

          {/* The hook fetches one page; say so rather than implying this is everything. */}
          {data?.hasMore && remaining === 0 && (
            <Text style={styles.truncated}>
              Showing the first {items.length} readings in this window
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: Colors.text },
  count: {
    fontSize: 11, fontWeight: '700', color: Solar.yellowDeep,
    backgroundColor: Solar.yellowSoft, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999,
  },
  window: { fontSize: 11, color: Colors.textMute, marginTop: 2, marginBottom: 10 },
  state: { fontSize: 12, color: Colors.textMute, paddingVertical: 16, textAlign: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  rowAlt: { backgroundColor: Solar.bg },
  headerRow: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 },
  cell: {
    width: 66, fontSize: 11, color: Colors.text, textAlign: 'right',
    paddingHorizontal: 6, fontVariant: ['tabular-nums'],
  },
  timeCell: { width: 128, textAlign: 'left' },
  headerCell: { fontSize: 10, fontWeight: '800', color: Colors.textMute },

  moreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 11, marginTop: 4,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  moreText: { fontSize: 12, fontWeight: '700', color: Solar.yellowDeep },
  truncated: { fontSize: 10, color: Colors.textFaint, textAlign: 'center', paddingTop: 10 },
});
