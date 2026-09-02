import { AlertListParams } from "../types/alert.types";

// The three buckets the web app splits alerts into (Battery alerts / Environmental alerts /
// Device alerts). The filter params mirror the web views 1:1 so both clients show the same rows:
//   - battery:       AlertsView.tsx           → excludeEnvironmentalIncidents + excludeIotDeviceAlerts
//   - environmental: EnvironmentalIncidentsView.tsx → siteLevelOnly
//   - device:        DeviceAlertsView.tsx      → iotOnly
export type AlertCategory = "battery" | "environmental" | "device";

export const ALERT_CATEGORY_PARAMS: Record<AlertCategory, AlertListParams> = {
  battery: {
    excludeEnvironmentalIncidents: true,
    excludeIotDeviceAlerts: true,
  },
  environmental: { siteLevelOnly: true },
  device: { iotOnly: true },
};

export const ALERT_CATEGORY_TABS: { key: AlertCategory; label: string }[] = [
  { key: "battery", label: "Battery" },
  { key: "environmental", label: "Environmental" },
  { key: "device", label: "Device" },
];
