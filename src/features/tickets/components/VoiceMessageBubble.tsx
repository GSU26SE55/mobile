import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Colors } from '@/src/lib/theme';
import { VoiceTranscriptionStatusEnum } from '../enums/chat.enum';
import { useLocalAudioUri } from '../hooks/useLocalAudioUri';

const BAR_COUNT = 28;

function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Sinh chiều cao waveform tĩnh (0.35–1) từ chuỗi seed (fileId) — cùng file luôn ra cùng
 * hình sóng, không nhấp nháy mỗi render. Chỉ để trang trí kiểu Zalo/Messenger; biên độ
 * thật của audio không có sẵn ở client nên dùng pattern giả lập ổn định.
 */
function seededWaveform(seed: string): number[] {
  const bars: number[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(0.35 + ((h % 1000) / 1000) * 0.65);
  }
  return bars;
}

interface Props {
  /** FileId audio — tải về local rồi phát, để đọc được tổng thời lượng. */
  fileId: string;
  /** Text transcribe hiển thị dưới player (kiểu Zalo). Rỗng thì không hiện. */
  transcript?: string;
  /** Tin của mình (bên phải) — đổi màu icon/sóng cho hợp nền accent. */
  isMe?: boolean;
  /** GH-83 — trạng thái transcribe. Chỉ `Failed` mới hiện khối báo lỗi + nút thử lại. */
  transcriptionStatus?: VoiceTranscriptionStatusEnum | null;
  /** Gọi khi bấm "Thử lại". Không truyền ⇒ ẩn nút (vd màn read-only). */
  onRetry?: () => void;
  /** Đang gửi request retry — khoá nút để không bắn trùng. */
  retrying?: boolean;
}

/**
 * Bong bóng tin nhắn thoại kiểu Zalo — nút play/pause + waveform tô dần theo tiến độ phát
 * + thời lượng + transcript bên dưới. Dùng chung staff + customer (qua ChatBubble).
 *
 * Tải file về local (useLocalAudioUri) rồi phát từ URI local — expo-audio đọc được TỔNG
 * THỜI LƯỢNG ngay (phát remote stream + Bearer header giữ duration=0 → "--:--").
 */
export function VoiceMessageBubble({
  fileId,
  transcript,
  isMe,
  transcriptionStatus,
  onRetry,
  retrying,
}: Props) {
  const localUri = useLocalAudioUri(fileId);
  const player = useAudioPlayer(localUri ? { uri: localUri } : null, { updateInterval: 120 });
  const status = useAudioPlayerStatus(player);

  // iOS: nếu máy đang ở chế độ im lặng (silent switch), audio sẽ bị tắt tiếng khi phát —
  // bật playsInSilentMode để nghe được tin nhắn thoại. allowsRecording=false để không giữ
  // route mic sau khi VoiceRecordingModal đã đóng.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
  }, []);

  const waveform = useMemo(() => seededWaveform(fileId), [fileId]);
  // Transcript ẩn mặc định — bấm nút mới xổ ra (giống Zalo hiển thị lời thoại theo yêu cầu).
  const [showTranscript, setShowTranscript] = useState(false);

  const duration = status.duration || 0;
  const current = status.currentTime || 0;
  const progress = duration > 0 ? Math.min(current / duration, 1) : 0;
  const playedBars = Math.round(progress * BAR_COUNT);

  // didJustFinish: expo-audio giữ nguyên vị trí cuối — seek về 0 để bấm play lại phát từ đầu.
  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish || current >= duration - 0.05) player.seekTo(0);
      player.play();
    }
  };

  const activeColor = isMe ? '#FFFFFF' : Colors.primary;
  const inactiveColor = isMe ? 'rgba(255,255,255,0.4)' : Colors.graySoft;
  const timeColor = isMe ? 'rgba(255,255,255,0.85)' : Colors.textMute;
  const transcriptColor = isMe ? '#FFFFFF' : Colors.text;
  const btnBg = isMe ? 'rgba(255,255,255,0.22)' : Colors.primaryLight;

  const timeLabel = duration > 0 ? formatDuration(current > 0 ? current : duration) : '--:--';

  return (
    <View style={styles.wrap}>
      <View style={styles.playerRow}>
        <Pressable
          style={[styles.playBtn, { backgroundColor: btnBg }]}
          onPress={togglePlay}
          hitSlop={8}
          disabled={!status.isLoaded && !status.isBuffering}
        >
          <Ionicons
            name={status.playing ? 'pause' : 'play'}
            size={18}
            color={activeColor}
            // icon play lệch phải một chút cho cân thị giác trong hình tròn
            style={status.playing ? undefined : { marginLeft: 2 }}
          />
        </Pressable>

        <View style={styles.waveform}>
          {waveform.map((barH, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: 6 + barH * 20,
                  backgroundColor: i < playedBars ? activeColor : inactiveColor,
                },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.time, { color: timeColor }]}>{timeLabel}</Text>
      </View>

      {/* Luồng transcribe async: Pending/Processing hiện dòng chờ nhẹ (body còn rỗng) để user biết
          lời thoại đang được xử lý, không tưởng tin lỗi. */}
      {(transcriptionStatus === VoiceTranscriptionStatusEnum.Pending ||
        transcriptionStatus === VoiceTranscriptionStatusEnum.Processing) && (
        <View style={styles.failedRow}>
          <Ionicons name="ellipsis-horizontal" size={13} color={timeColor} />
          <Text style={[styles.processingText, { color: timeColor }]}>
            Đang chuyển lời thoại thành văn bản…
          </Text>
        </View>
      )}

      {/* GH-83 — Failed: báo lỗi + nút thử lại (retry chỉ có nghĩa khi audio đã upload thành công). */}
      {transcriptionStatus === VoiceTranscriptionStatusEnum.Failed && (
        <View style={styles.failedRow}>
          <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
          <Text style={styles.failedText}>Không nhận dạng được lời thoại</Text>
          {onRetry && (
            <Pressable onPress={onRetry} disabled={retrying} hitSlop={6}>
              <Text style={[styles.retryText, retrying && styles.retryTextDisabled]}>
                {retrying ? 'Đang thử…' : 'Thử lại'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {!!transcript?.trim() && (
        <>
          <Pressable
            style={styles.transcriptToggle}
            onPress={() => setShowTranscript((v) => !v)}
            hitSlop={6}
          >
            <Text style={[styles.transcriptToggleText, { color: timeColor }]}>
              {showTranscript ? 'Ẩn lời thoại' : 'Xem lời thoại'}
            </Text>
            <Ionicons
              name={showTranscript ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={timeColor}
            />
          </Pressable>
          {showTranscript && (
            <Text style={[styles.transcript, { color: transcriptColor }]}>{transcript.trim()}</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minWidth: 200, gap: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 28,
  },
  waveBar: { flex: 1, borderRadius: 2, minWidth: 2 },
  time: { fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'], minWidth: 38, textAlign: 'right' },
  transcriptToggle: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  transcriptToggleText: { fontSize: 11, fontWeight: '600', textDecorationLine: 'underline' },
  transcript: { fontSize: 13.5, fontWeight: '500', lineHeight: 19 },
  // GH-83 — khối báo transcribe thất bại + nút thử lại.
  failedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  failedText: { fontSize: 11.5, color: Colors.danger, flexShrink: 1 },
  processingText: { fontSize: 11.5, flexShrink: 1, fontStyle: 'italic' },
  retryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.danger,
    textDecorationLine: 'underline',
  },
  retryTextDisabled: { opacity: 0.5, textDecorationLine: 'none' },
});
