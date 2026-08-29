import { AnomalyTypeEnum } from '@/src/shared/enums/alert.enum';

// Tách khỏi AssetAlertList: hook useReadingEvidence cũng cần bảng nhãn này, mà import ngược
// từ hook sang một component React Native kéo cả cây UI vào tầng dữ liệu.
export const ANOMALY_LABEL: Record<AnomalyTypeEnum, string> = {
  [AnomalyTypeEnum.Overheat]: 'Overheat',
  [AnomalyTypeEnum.Overvoltage]: 'Overvoltage',
  [AnomalyTypeEnum.Undervoltage]: 'Undervoltage',
  [AnomalyTypeEnum.LowSoc]: 'Low SOC',
  [AnomalyTypeEnum.RapidDischarge]: 'Rapid discharge',
  [AnomalyTypeEnum.AbnormalCharging]: 'Abnormal charging',
  [AnomalyTypeEnum.DeviceOffline]: 'Device offline',
  [AnomalyTypeEnum.SohDegradation]: 'SOH degradation',
  [AnomalyTypeEnum.HighAmbientTemp]: 'High ambient temperature',
  [AnomalyTypeEnum.HighHumidity]: 'High humidity',
  [AnomalyTypeEnum.HighTempHumidityCombo]: 'High temperature + humidity',
  [AnomalyTypeEnum.HighInternalResistance]: 'High internal resistance',
  [AnomalyTypeEnum.CellImbalance]: 'Cell imbalance',
  [AnomalyTypeEnum.EnvironmentalIncident]: 'Environmental incident',
  [AnomalyTypeEnum.SensorMismatch]: 'Sensor mismatch',
  [AnomalyTypeEnum.Undertemp]: 'Low temperature',
  [AnomalyTypeEnum.IotDataIntegrityViolation]: 'IoT data integrity violation',
};
