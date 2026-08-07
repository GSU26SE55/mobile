import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Solar } from '@/src/lib/theme';
import { BatteryAssetDto } from '../types/battery.types';
import {
  BatteryStatusEnum,
  WarrantyStatusEnum,
} from '../enums/battery.enum';
import { GlassSurface } from './EnergyBackdrop';

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

interface Props {
  battery: BatteryAssetDto;
  customerName?: string | null;
}

export function BatteryInfoCard({ battery, customerName }: Props) {
  const finalCustomerName = customerName || battery.customerName || (battery as any).accountName || 'Khách hàng cá nhân';

  const rows: { label: string; value: string }[] = [
    { label: 'Serial', value: battery.serialNumber },
    { label: 'Loại pin', value: battery.batteryTypeName },
    { label: 'Site', value: battery.siteName ?? 'Chưa gán' },
    { label: 'Khách hàng', value: finalCustomerName },
    { label: 'Ngày lắp đặt', value: formatDate(battery.installDate) },
    { label: 'Bảo hành', value: WARRANTY_LABEL[battery.warrantyStatus] ?? '—' },
    { label: 'Trạng thái', value: STATUS_LABEL[battery.status] ?? 'Unknown' },
  ];
  // Đã bỏ dòng Vị trí theo yêu cầu khoanh hình của người dùng

  return (
    <GlassSurface style={styles.card}>
      {rows.map((r, i) => (
        <View key={r.label} style={[styles.row, i > 0 && styles.rowBorder]}>
          <Text style={styles.label}>{r.label}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {r.value}
          </Text>
        </View>
      ))}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(235, 230, 215, 0.6)' },
  label: { fontSize: 13, color: Solar.mute, fontWeight: '600' },
  value: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13.5,
    fontWeight: '900',
    color: Solar.ink,
  },
});
