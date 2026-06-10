import { create } from 'zustand';

export interface AlertItem {
  id: string;
  type: 'Critical' | 'Warning' | 'Info';
  title: string;
  time: string;
  batteryId: string;
  threshold: string;
  actual: string;
  ticketCode: string | null;
  read: boolean;
  acknowledged: boolean;
}

interface AlertsState {
  alerts: AlertItem[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  acknowledge: (id: string) => void;
  getUnreadCount: () => number;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [
    {
      id: 'AL-2104',
      type: 'Critical',
      title: 'Nhiệt độ vượt ngưỡng',
      time: '8 phút trước',
      batteryId: 'battery-c',
      threshold: '45°C',
      actual: '47.8°C',
      ticketCode: 'TK-2104',
      read: false,
      acknowledged: false,
    },
    {
      id: 'AL-2103',
      type: 'Critical',
      title: 'SOC dưới ngưỡng an toàn',
      time: '21 phút trước',
      batteryId: 'battery-c',
      threshold: '20%',
      actual: '18%',
      ticketCode: 'TK-2099',
      read: false,
      acknowledged: false,
    },
    {
      id: 'AL-2102',
      type: 'Warning',
      title: 'Nhiệt độ tăng nhanh',
      time: '50 phút trước',
      batteryId: 'battery-b',
      threshold: '35°C',
      actual: '36.4°C',
      ticketCode: null,
      read: true,
      acknowledged: false,
    },
    {
      id: 'AL-2101',
      type: 'Info',
      title: 'Sạc hoàn tất',
      time: '16 giờ trước',
      batteryId: 'battery-a',
      threshold: '100%',
      actual: '100%',
      ticketCode: null,
      read: true,
      acknowledged: false,
    },
  ],
  markAsRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, read: true } : a
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
    })),
  acknowledge: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true, read: true } : a
      ),
    })),
  getUnreadCount: () => {
    return get().alerts.filter((a) => !a.read).length;
  },
}));
