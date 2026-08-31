import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  /** Staff-only: tapping the Customer row opens contact details. Omit for the Customer screen
   *  (a customer viewing their own battery has no reason to "look up" themselves). */
  onPressCustomer?: () => void;
}

export function BatteryInfoCard({ battery, customerName, onPressCustomer }: Props) {
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
      {rows.map((r, i) => {
        const isCustomerRow = r.label === 'Customer';
        const content = (
          <>
            <Text style={styles.label}>{r.label}</Text>
            <View style={styles.valueWrap}>
              <Text style={styles.value} numberOfLines={1}>
                {r.value}
              </Text>
              {isCustomerRow && onPressCustomer && (
                <Ionicons name="chevron-forward" size={14} color={Solar.mute} />
              )}
            </View>
          </>
        );
        return isCustomerRow && onPressCustomer ? (
          <Pressable
            key={r.label}
            style={[styles.row, i > 0 && styles.rowBorder]}
            onPress={onPressCustomer}
            accessibilityRole="button"
            accessibilityLabel="View customer contact information"
          >
            {content}
          </Pressable>
        ) : (
          <View key={r.label} style={[styles.row, i > 0 && styles.rowBorder]}>
            {content}
          </View>
        );
      })}
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
  valueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13.5,
    fontWeight: '900',
    color: Solar.ink,
  },
});
