import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { BadgeColors, Colors, Shadow } from '@/src/lib/theme';

// Two overview card components:
//  - StatTrio     : 3-column layout (2 round tiles + 1 ring in the middle) — still used by staff dashboard.
//  - FleetOverview: "status light" layout (gauge on the left + 2 boxes on the right) — customer dashboard.
// Both share RingStat (SVG ring) + the current palette.

interface RingProps {
  percent: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  value?: string; // large text in the middle of the ring
  label?: string; // small caption below the value
}

export function RingStat({
  percent,
  size = 128,
  strokeWidth = 11,
  color = Colors.primary,
  trackColor = Colors.card3,
  value,
  label,
}: RingProps) {
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - p / 100);
  const c = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      <Text style={styles.ringValue}>{value ?? `${Math.round(p)}%`}</Text>
      {label ? <Text style={styles.ringLabel}>{label}</Text> : null}
    </View>
  );
}

// ============================================================================
// StatTrio — 3-column (kept as-is for staff dashboard: in progress / progress / completed)
// ============================================================================

function SideTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.sideTile}>
      <Text style={styles.sideTileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.sideTileLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

interface TrioProps {
  left: { value: string; label: string };
  right: { value: string; label: string };
  center: { percent: number; value?: string; label: string; color?: string };
}

export function StatTrio({ left, center, right }: TrioProps) {
  return (
    <View style={[styles.trioCard, Shadow]}>
      <SideTile value={left.value} label={left.label} />
      <RingStat percent={center.percent} value={center.value} label={center.label} color={center.color} />
      <SideTile value={right.value} label={right.label} />
    </View>
  );
}

// ============================================================================
// FleetOverview — "status light" for customer dashboard
// Gauge (good batteries / total) aligned left; 2 metric boxes stacked right; background color changes by tone.
// ============================================================================

export type Tone = 'ok' | 'warn' | 'crit';

// Palette by tone — taken from theme tokens, no hardcoding new values.
const TONE = {
  ok: { bg: Colors.primaryLight, accent: Colors.primary, chip: BadgeColors.ok },
  warn: { bg: Colors.warningLight, accent: Colors.warning, chip: BadgeColors.warn },
  crit: { bg: Colors.dangerLight, accent: Colors.danger, chip: BadgeColors.crit },
} as const;

export interface MetricBox {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string; // number color (default dark accent)
  barPercent?: number; // if present → render mini bar 0-100
}

function MetricTile({ box, accent }: { box: MetricBox; accent: string }) {
  const valueColor = box.color ?? Colors.accent;
  return (
    <View style={styles.tile}>
      <View style={styles.tileHead}>
        <Ionicons name={box.icon} size={13} color={Colors.gray} />
        <Text style={styles.tileLabel} numberOfLines={1}>
          {box.label}
        </Text>
      </View>
      <Text style={[styles.tileValue, { color: valueColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {box.value}
      </Text>
      {box.barPercent != null ? (
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.max(0, Math.min(100, box.barPercent))}%`, backgroundColor: accent },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

interface FleetOverviewProps {
  tone: Tone;
  gauge: { goodCount: number; total: number };
  boxes: [MetricBox, MetricBox];
  statusLabel: string;
}

export function FleetOverview({ tone, gauge, boxes, statusLabel }: FleetOverviewProps) {
  const t = TONE[tone];
  const ringPercent = gauge.total > 0 ? (gauge.goodCount / gauge.total) * 100 : 0;

  return (
    <View style={[styles.card, { backgroundColor: t.bg }, Shadow]}>
      <View style={styles.body}>
        <RingStat
          percent={ringPercent}
          size={118}
          color={t.accent}
          trackColor={Colors.white}
          value={`${gauge.goodCount}/${gauge.total}`}
          label="healthy batteries"
        />
        <View style={styles.boxes}>
          <MetricTile box={boxes[0]} accent={t.accent} />
          <MetricTile box={boxes[1]} accent={t.accent} />
        </View>
      </View>

      <View style={[styles.statusRow, { backgroundColor: t.chip.bg }]}>
        <View style={[styles.statusDot, { backgroundColor: t.accent }]} />
        <Text style={[styles.statusText, { color: t.chip.text }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringValue: { fontSize: 26, fontWeight: '800', color: Colors.accent },
  ringLabel: { fontSize: 11, color: Colors.gray, fontWeight: '600', marginTop: 2, textAlign: 'center' },

  // --- StatTrio (3-column) ---
  trioCard: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sideTile: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sideTileValue: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  sideTileLabel: { fontSize: 10, color: Colors.gray, fontWeight: '600', marginTop: 3, textAlign: 'center' },

  // --- FleetOverview ---
  card: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 24,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  boxes: {
    flex: 1,
    gap: 10,
  },
  tile: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tileHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  tileLabel: { fontSize: 11, color: Colors.gray, fontWeight: '600' },
  tileValue: { fontSize: 20, fontWeight: '800', color: Colors.accent },

  barTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.card3,
    marginTop: 8,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 16,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },
});
