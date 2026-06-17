import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../lib/theme';
import { BatteryAssetDto } from '../types/battery.types';
import {
  BatteryStatusEnum,
  WarrantyStatusEnum,
} from '../enums/battery.enum';

const STATUS_LABEL: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: 'Active',
  [BatteryStatusEnum.Inactive]: 'Inactive',
  [BatteryStatusEnum.Decommissioned]: 'Ngừng sử dụng',
};

const WARRANTY_LABEL: Record<WarrantyStatusEnum, string> = {
  [WarrantyStatusEnum.Active]: 'Còn bảo hành',
  [WarrantyStatusEnum.Expired]: 'Hết bảo hành',
  [WarrantyStatusEnum.Void]: 'Vô hiệu',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export function BatteryInfoCard({ battery }: { battery: BatteryAssetDto }) {
  return (
    <View style={[styles.card, Shadow]}>
      <InfoRow icon="barcode-outline" label="Serial Number" value={battery.serialNumber} />
      <Divider />
      <InfoRow icon="cube-outline" label="Loại pin" value={battery.batteryTypeName} />
      <Divider />
      <InfoRow icon="location-outline" label="Site" value={battery.siteName ?? 'Chưa gán'} />
      <Divider />
      <InfoRow icon="person-outline" label="Khách hàng" value={battery.customerName} />
      <Divider />
      <InfoRow icon="calendar-outline" label="Ngày lắp đặt" value={formatDate(battery.installDate)} />
      <Divider />
      <InfoRow
        icon="shield-checkmark-outline"
        label="Bảo hành"
        value={WARRANTY_LABEL[battery.warrantyStatus] ?? '—'}
      />
      <Divider />
      <InfoRow
        icon="pulse-outline"
        label="Trạng thái"
        value={STATUS_LABEL[battery.status] ?? 'Unknown'}
      />
      {battery.location ? (
        <>
          <Divider />
          <InfoRow icon="navigate-outline" label="Vị trí" value={battery.location} />
        </>
      ) : null}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={16} color={Colors.textMute} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, color: Colors.textMute, fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '800', color: Colors.accent, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)' },
});
