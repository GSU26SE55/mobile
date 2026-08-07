import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { useReadingEvidence, toWarningRows } from '../hooks/useReadingEvidence';

/** Số dòng hiện sẵn trước khi bấm "Xem thêm". */
const PREVIEW_ROWS = 10;
/** Mỗi lần bấm "Xem thêm" mở thêm bấy nhiêu dòng. */
const LOAD_MORE_STEP = 25;

const num = (v: number | null | undefined, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : '—';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

interface Props {
  batteryAssetId?: string | null;
  /** Thời điểm phát hiện sự cố — mốc để lấy log bằng chứng (±15'). */
  detectedAt?: string | null;
}

/**
 * Bằng chứng cảnh báo — CHỈ hiển thị reading vượt ngưỡng quanh thời điểm phát hiện sự cố
 * (DetectedAt ±15'), KHÔNG phải log real-time. Để Staff/Manager đối chiếu ticket có thật
 * hay không. Bản mobile của `BatteryWarningEvidencePanel` bên web — giữ cùng cột và cùng
 * ngưỡng để hai nền tảng không hiện hai bộ số khác nhau cho cùng một ticket.
 *
 * Bảng cuộn ngang: 6 cột số không vừa bề ngang điện thoại, ép vừa thì chữ bị bóp không đọc nổi.
 */
export function BatteryWarningEvidencePanel({ batteryAssetId, detectedAt }: Props) {
  const { data, isLoading } = useReadingEvidence(batteryAssetId, detectedAt);
  const warnings = toWarningRows(data?.items ?? []);

  // Cửa sổ ±15' ở tần suất 5s cho ra vài trăm dòng — đổ hết thì bảng nuốt trọn màn hình
  // và đẩy mọi thứ khác xuống dưới. Mặc định 10 dòng, mỗi lần "Xem thêm" mở thêm 25.
  const [limit, setLimit] = useState(PREVIEW_ROWS);
  const visibleRows = warnings.slice(0, limit);
  const hiddenCount = warnings.length - visibleRows.length;

  // Không có pin hoặc ticket không có mốc phát hiện → không có bằng chứng để hiện.
  if (!batteryAssetId || !detectedAt) return null;

  return (
    <View>
      <View style={styles.headRow}>
        <Ionicons name="shield-checkmark" size={15} color={Colors.warningDark} />
        <Text style={styles.headText}>BẰNG CHỨNG CẢNH BÁO (LÚC PHÁT HIỆN)</Text>
        {warnings.length > 0 && (
          <Text style={styles.headCount}>{warnings.length}</Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : warnings.length === 0 ? (
        <Text style={styles.empty}>Không có cảnh báo bất thường quanh thời điểm phát hiện.</Text>
      ) : (
        <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.theadRow}>
              <Text style={[styles.th, styles.colTime]}>Thời điểm</Text>
              <Text style={[styles.th, styles.colNum]}>V</Text>
              <Text style={[styles.th, styles.colNum]}>A</Text>
              <Text style={[styles.th, styles.colNum]}>°C</Text>
              <Text style={[styles.th, styles.colNum]}>SOC%</Text>
              <Text style={[styles.th, styles.colWarn]}>Cảnh báo</Text>
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

        {/* Nút nằm NGOÀI ScrollView ngang — để trong thì nó trôi theo trục ngang và
            biến mất khỏi khung nhìn khi người dùng đang xem cột "Cảnh báo". */}
        {hiddenCount > 0 && (
          <Pressable
            style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.6 }]}
            onPress={() => setLimit((v) => v + LOAD_MORE_STEP)}
          >
            <Text style={styles.moreText}>
              Xem thêm {Math.min(LOAD_MORE_STEP, hiddenCount)} dòng
            </Text>
            <Text style={styles.moreCount}>còn {hiddenCount}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.primaryDark} />
          </Pressable>
        )}

        {/* Đã mở hết mà danh sách dài thì cho thu gọn lại, đỡ phải cuộn ngược lâu. */}
        {hiddenCount === 0 && warnings.length > PREVIEW_ROWS && (
          <Pressable
            style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.6 }]}
            onPress={() => setLimit(PREVIEW_ROWS)}
          >
            <Text style={styles.moreText}>Thu gọn</Text>
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
