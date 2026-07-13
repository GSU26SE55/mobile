import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  return d.toLocaleDateString('vi-VN');
}

export function BatteryInfoCard({ battery }: { battery: BatteryAssetDto }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Serial', value: battery.serialNumber },
    { label: 'Loại pin', value: battery.batteryTypeName },
    { label: 'Site', value: battery.siteName ?? 'Chưa gán' },
    { label: 'Khách hàng', value: battery.customerName || '—' },
    { label: 'Ngày lắp đặt', value: formatDate(battery.installDate) },
    { label: 'Bảo hành', value: WARRANTY_LABEL[battery.warrantyStatus] ?? '—' },
    { label: 'Trạng thái', value: STATUS_LABEL[battery.status] ?? 'Unknown' },
  ];
  if (battery.location) rows.push({ label: 'Vị trí', value: battery.location });

  return (
    <View style={[styles.card, Shadow]}>
      {rows.map((r, i) => (
        <View key={r.label} style={[styles.row, i > 0 && styles.rowBorder]}>
          <Text style={styles.label}>{r.label}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {r.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 11,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  label: { fontSize: 12.5, color: Colors.textMute, fontWeight: '600' },
  value: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.accent,
  },
});
