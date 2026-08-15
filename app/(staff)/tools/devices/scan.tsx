import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/src/lib/theme';
import { BackButton } from '@/src/shared/components/ScreenHeader';
import { iotDeviceService } from '@/src/features/iot-devices/services/iot-device.service';

/**
 * IOT3-65 — quét QR trên nhãn thiết bị để tra cứu.
 *
 * Trước đây `package.json` chỉ có `react-native-qrcode-svg`, tức là **hiển thị** QR chứ không
 * **quét** được. Kỹ thuật viên vẫn phải gõ tay `deviceCode` — mà mã kiểu `GW-ESP32-001` gõ sai
 * một ký tự là ra 404 không rõ nguyên nhân, đứng giữa trạm pin thì rất khó chịu.
 *
 * ⚠️ Chỉ TRA CỨU. Không nạp gì vào thiết bị từ đây: QR trên nhãn chứa cả API key
 * (`iot://provision?dc=...&key=...`), nên mọi thao tác ghi phải đi qua đường admin có kiểm quyền.
 */

/**
 * Rút `deviceCode` từ nội dung QR.
 *
 * Nhận hai dạng, vì nhãn in ra ngoài hiện trường không phải lúc nào cũng theo một khuôn:
 *   1. `iot://provision?dc=GW-ESP32-001&key=iotk_...`  — nhãn chuẩn do trang admin sinh
 *   2. `GW-ESP32-001`                                   — mã trần, ai đó tự in
 *
 * KHÔNG lấy phần `key`: màn hình này chỉ tra cứu, giữ khoá lại trong bộ nhớ là mở rộng bề mặt
 * rò rỉ mà chẳng để làm gì.
 */
export function extractDeviceCode(raw: string): string | null {
  const text = (raw ?? '').trim();
  if (!text) return null;

  if (text.toLowerCase().startsWith('iot://')) {
    // `new URL()` của Hermes không parse được scheme lạ ⇒ tự bóc query string.
    const q = text.indexOf('?');
    if (q < 0) return null;
    for (const part of text.slice(q + 1).split('&')) {
      const [k, v] = part.split('=');
      if (k === 'dc' && v) {
        try {
          return decodeURIComponent(v).trim().toUpperCase();
        } catch {
          return v.trim().toUpperCase();
        }
      }
    }
    return null;
  }

  // Mã trần: chỉ nhận ký tự có thể có trong deviceCode, tránh quét nhầm mã vạch bao bì.
  return /^[A-Za-z0-9._-]{3,64}$/.test(text) ? text.toUpperCase() : null;
}

export default function DeviceScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Camera bắn liên tục nhiều khung cùng một mã ⇒ khoá lại sau lần đầu, nếu không sẽ đẩy
  // chồng hàng chục màn hình lên nhau.
  const handled = useRef(false);

  const onScanned = async ({ data }: { data: string }) => {
    if (handled.current || busy) return;

    const code = extractDeviceCode(data);
    if (!code) {
      setError('This QR code is not a device label. Scan the sticker on the unit itself.');
      return;
    }

    handled.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await iotDeviceService.getByCode(code);
      const device = res.data.data;
      if (!device) throw new Error('not-found');
      router.replace(`/(staff)/tools/devices/${device.id}`);
    } catch {
      // Mở lại cho quét tiếp — bắt kỹ thuật viên thoát ra vào lại chỉ để thử mã khác là vô lý.
      handled.current = false;
      setBusy(false);
      setError(
        `Device "${code}" was not found. Check the label, or the device may not be registered yet.`,
      );
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primaryDark} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <BackButton />
          <Text style={styles.topTitle}>Scan device label</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={44} color={Colors.textFaint} />
          <Text style={styles.permText}>
            Cần quyền dùng camera để quét mã QR trên nhãn thiết bị.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Allow</Text>
          </Pressable>
          {!permission.canAskAgain && (
            // Bị từ chối vĩnh viễn thì nút trên không làm gì cả — phải nói ra, không thì người
            // dùng bấm mãi mà không hiểu vì sao không có phản hồi.
            <Text style={styles.permHint}>
              Bạn đã từ chối trước đó — hãy bật lại trong Cài đặt của điện thoại.
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        // Chỉ nhận QR: nhãn thiết bị dùng QR, còn bao bì xung quanh đầy mã vạch 1D sẽ làm
        // camera liên tục bắt nhầm.
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScanned}
      />

      <View style={[styles.overlayTop, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <Text style={styles.overlayTitle}>Scan device label</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.frameHint}>Line the QR code up inside the frame</Text>
      </View>

      {(busy || error) && (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={Colors.primaryDark} />
              <Text style={styles.busyText}>Looking up the device…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.primaryBtn} onPress={() => setError(null)}>
                <Text style={styles.primaryBtnText}>Scan again</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.bg,
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  headerSpacer: { width: 44 },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  frame: {
    width: 240,
    height: 240,
    borderRadius: Radius.md,
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  frameHint: { color: '#fff', fontSize: 13, fontWeight: '600' },
  bottomSheet: {
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    gap: 12,
  },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  busyText: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  errorText: { fontSize: 13, color: Colors.dangerDark, lineHeight: 19 },
  permText: { fontSize: 14, color: Colors.textMute, textAlign: 'center', lineHeight: 20 },
  permHint: { fontSize: 12, color: Colors.textFaint, textAlign: 'center' },
  primaryBtn: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.accent },
});
