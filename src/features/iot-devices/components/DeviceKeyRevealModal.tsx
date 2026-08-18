import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Colors, Radius } from '@/src/lib/theme';
import type { IotDeviceCreatedDto, IotDeviceDetailDto } from '../types/iot-device.types';

/**
 * Mirrors the web's `DeviceSecrets` shape (`features/staff/components/iot/deviceSecrets.ts`) —
 * accepts either the rotate response (`IotDeviceCreatedDto`) or the re-readable detail
 * (`IotDeviceDetailDto`).
 */
export interface DeviceSecrets {
  deviceCode: string;
  displayName: string;
  apiKey: string | null;
  provisioningQrCode: string | null;
  mqttUsername: string | null;
  mqttPassword: string | null;
  mqttBrokerHost: string | null;
  mqttBrokerPort: number | null;
  mqttUseTls: boolean | null;
  mqttTopicPrefix: string | null;
}

export function fromCreatedDto(d: IotDeviceCreatedDto): DeviceSecrets {
  return {
    deviceCode: d.deviceCode,
    displayName: d.displayName,
    apiKey: d.rawApiKey,
    provisioningQrCode: d.provisioningQrCode,
    mqttUsername: d.mqttUsername,
    mqttPassword: d.mqttPassword,
    mqttBrokerHost: d.mqttBrokerHost,
    mqttBrokerPort: d.mqttBrokerPort,
    mqttUseTls: d.mqttUseTls,
    mqttTopicPrefix: d.mqttTopicPrefix,
  };
}

export function fromDetailDto(d: IotDeviceDetailDto): DeviceSecrets {
  return {
    deviceCode: d.deviceCode,
    displayName: d.displayName,
    apiKey: d.apiKey,
    provisioningQrCode: d.provisioningQrCode,
    mqttUsername: d.mqttUsername,
    mqttPassword: d.mqttPassword,
    mqttBrokerHost: d.mqttBrokerHost,
    mqttBrokerPort: d.mqttBrokerPort,
    mqttUseTls: d.mqttUseTls,
    mqttTopicPrefix: d.mqttTopicPrefix,
  };
}

const localSetupImportUrl =
  process.env.EXPO_PUBLIC_IOT_SETUP_URL?.trim() || 'http://192.168.4.1:8080/import';
const deviceApiUrl = process.env.EXPO_PUBLIC_IOT_DEVICE_API_URL?.trim() || '';
const deviceMqttHost = process.env.EXPO_PUBLIC_IOT_MQTT_HOST?.trim() || '';
const configuredMqttPort = Number(process.env.EXPO_PUBLIC_IOT_MQTT_PORT || 0);

/**
 * Convert the backend's canonical `iot://provision?...` payload into a URL a phone camera can
 * open — same transform as the web app's `buildScannableProvisioningUrl` (IOT3-72).
 */
function buildScannableProvisioningUrl(payload: string, device: DeviceSecrets): string {
  try {
    const source = new URL(payload);
    const deviceCode = source.searchParams.get('dc');
    const apiKey = source.searchParams.get('key');
    if (source.protocol !== 'iot:' || source.hostname !== 'provision' || !deviceCode || !apiKey) {
      return payload;
    }

    const target = new URL(localSetupImportUrl);
    target.searchParams.set('dc', deviceCode);
    target.searchParams.set('key', apiKey);
    if (deviceApiUrl) target.searchParams.set('api', deviceApiUrl);

    const mqttHost = deviceMqttHost || device.mqttBrokerHost;
    const mqttPort = configuredMqttPort || device.mqttBrokerPort;
    if (mqttHost) target.searchParams.set('mh', mqttHost);
    if (mqttPort) target.searchParams.set('mp', String(mqttPort));
    if (device.mqttUseTls != null) target.searchParams.set('mt', device.mqttUseTls ? '1' : '0');
    return target.toString();
  } catch {
    return payload;
  }
}

function SecretRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {/* `selectable` — long-press to copy via the OS text selection menu; no extra package needed. */}
      <Text style={styles.rowValue} selectable>
        {value}
      </Text>
    </View>
  );
}

interface Props {
  visible: boolean;
  device: DeviceSecrets | null;
  onClose: () => void;
}

export default function DeviceKeyRevealModal({ visible, device, onClose }: Props) {
  if (!device) return null;
  const hasBroker = !!device.mqttBrokerHost;
  const scannableProvisioningUrl = device.provisioningQrCode
    ? buildScannableProvisioningUrl(device.provisioningQrCode, device)
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Device provisioning details</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={Colors.textMute} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            {device.deviceCode} · {device.displayName}
          </Text>
          <Text style={styles.hint}>Long-press a value to copy it.</Text>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {scannableProvisioningUrl ? (
              <View style={styles.qrWrap}>
                <View style={styles.qrCard}>
                  <QRCode value={scannableProvisioningUrl} size={180} />
                </View>
                <Text style={styles.qrHint}>
                  Scan with the phone connected to the SolarGW-xxxx Wi-Fi network, at{' '}
                  192.168.4.1:8080.
                </Text>
              </View>
            ) : (
              <Text style={styles.notice}>
                This device was created before the system stored re-readable API keys, so the QR
                code cannot be rebuilt. Use Rotate API key to issue a new one.
              </Text>
            )}

            {device.apiKey ? (
              <SecretRow label="API Key" value={device.apiKey} />
            ) : (
              <Text style={styles.notice}>No re-readable API key was stored for this device.</Text>
            )}

            {hasBroker ? (
              <>
                {device.mqttUsername && (
                  <SecretRow label="MQTT Username" value={device.mqttUsername} />
                )}
                {device.mqttPassword ? (
                  <SecretRow label="MQTT Password" value={device.mqttPassword} />
                ) : (
                  <Text style={styles.noticeWarn}>
                    The MQTT password cannot be read back — use Rotate MQTT key, the device
                    fetches a new one itself via /provision, no site visit needed.
                  </Text>
                )}
                <SecretRow label="MQTT Broker Host" value={device.mqttBrokerHost!} />
                <SecretRow label="MQTT Broker Port" value={String(device.mqttBrokerPort ?? '')} />
                {device.mqttUseTls !== null && (
                  <SecretRow label="MQTT TLS" value={device.mqttUseTls ? 'true' : 'false'} />
                )}
                {device.mqttTopicPrefix && (
                  <SecretRow label="MQTT Topic Prefix" value={device.mqttTopicPrefix} />
                )}
              </>
            ) : (
              <Text style={styles.notice}>
                The MQTT bridge is not enabled on the server — no broker details to show.
              </Text>
            )}
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    padding: 16,
    maxHeight: '80%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMute, marginTop: 4, fontFamily: 'monospace' },
  hint: { fontSize: 11, color: Colors.textFaint, marginTop: 2, marginBottom: 12 },
  body: { flexGrow: 0 },
  bodyContent: { gap: 12, paddingBottom: 8 },
  qrWrap: { alignItems: 'center', gap: 8, marginBottom: 4 },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrHint: { fontSize: 11, color: Colors.textMute, textAlign: 'center', maxWidth: 260, lineHeight: 16 },
  row: { gap: 4 },
  rowLabel: { fontSize: 12, color: Colors.textMute, fontWeight: '600' },
  rowValue: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: 'monospace',
    backgroundColor: Colors.bg,
    borderRadius: Radius.xs,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notice: { fontSize: 13, color: Colors.textMute, lineHeight: 18 },
  noticeWarn: { fontSize: 13, color: Colors.warningDark, lineHeight: 18 },
  closeBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.text },
});
