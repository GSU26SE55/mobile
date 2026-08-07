import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/src/lib/theme';

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface Props {
  visible: boolean;
  elapsedSeconds: number;
  /** Giá trị 0-1 — biên độ mic hiện tại, làm quả cầu giữa "thở" theo giọng nói. */
  level: number;
  transcribing?: boolean;
  onStop: () => void;
  onCancel: () => void;
}

const RING_DELAY_MS = 500;
const RING_DURATION_MS = 1800;

/** 1 vòng sóng loang ra rồi mờ dần, lặp vô hạn — lệch pha theo `delay` để tạo hiệu ứng nhiều lớp. */
function Ring({ delay, color }: { delay: number; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | null = null;
    const timer = setTimeout(() => {
      if (cancelled) return;
      loop = Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: RING_DURATION_MS,
          useNativeDriver: true,
        }),
      );
      loop.start();
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      loop?.stop();
    };
  }, [delay, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const opacity = progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.55, 0.4, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { borderColor: color, opacity, transform: [{ scale }] },
      ]}
    />
  );
}

/**
 * Overlay ghi âm kiểu Gemini — quả cầu gradient giữa màn hình phát sóng loang liên tục,
 * "thở" theo biên độ giọng nói (level 0-1 từ useVoiceRecorder). Thay cho thanh ghi âm
 * gọn trong composer (dùng bên Web) vì trên mobile có đủ không gian cho trải nghiệm
 * toàn màn hình, tập trung hơn.
 */
export function VoiceRecordingModal({ visible, elapsedSeconds, level, transcribing, onStop, onCancel }: Props) {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(breathe, {
      toValue: level,
      duration: 90,
      useNativeDriver: true,
    }).start();
  }, [level, breathe]);

  const coreScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.orbWrap}>
          <Ring delay={0} color="#4F8CFF" />
          <Ring delay={RING_DELAY_MS} color="#B156E8" />
          <Ring delay={RING_DELAY_MS * 2} color="#FF6FA8" />
          <Animated.View style={{ transform: [{ scale: coreScale }] }}>
            <LinearGradient
              colors={['#4F8CFF', '#B156E8', '#FF6FA8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.core}
            >
              <Ionicons name="mic" size={30} color="#FFF" />
            </LinearGradient>
          </Animated.View>
        </View>

        <Text style={styles.timer}>{formatElapsed(elapsedSeconds)}</Text>
        <Text style={styles.hint}>{transcribing ? 'Đang xử lý...' : 'Đang nghe...'}</Text>

        <View style={styles.actions}>
          <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={transcribing}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </Pressable>
          <Pressable style={styles.stopBtn} onPress={onStop} disabled={transcribing}>
            {transcribing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="checkmark" size={24} color="#FFF" />
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const ORB_SIZE = 96;
const RING_SIZE = ORB_SIZE;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 20, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  orbWrap: {
    width: RING_SIZE * 2.6,
    height: RING_SIZE * 2.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
  },
  core: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  hint: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginTop: -12 },
  actions: { flexDirection: 'row', gap: 24, marginTop: 20 },
  cancelBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  stopBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
