import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDate } from '@/src/lib/date';
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
  [BatteryStatusEnum.Decommissioned]: 'Decommissioned',
};

const WARRANTY_LABEL: Record<WarrantyStatusEnum, string> = {
  [WarrantyStatusEnum.Active]: 'Under warranty',
  [WarrantyStatusEnum.Expired]: 'Warranty expired',
  [WarrantyStatusEnum.Void]: 'Void',
};

interface Props {
  battery: BatteryAssetDto;
  customerName?: string | null;
}

export function BatteryInfoCard({ battery, customerName }: Props) {
  const finalCustomerName = customerName || battery.customerName || (battery as any).accountName || 'Individual customer';

  const rows: { label: string; value: string }[] = [
    { label: 'Serial', value: battery.serialNumber },
    { label: 'Battery type', value: battery.batteryTypeName },
    { label: 'Site', value: battery.siteName ?? 'Unassigned' },
    { label: 'Customer', value: finalCustomerName },
    { label: 'Install date', value: formatDate(battery.installDate) },
    { label: 'Warranty', value: WARRANTY_LABEL[battery.warrantyStatus] ?? '—' },
    { label: 'Status', value: STATUS_LABEL[battery.status] ?? 'Unknown' },
  ];
  // Location row removed per user's screenshot-marked request

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
