import { Tabs } from 'expo-router';

export default function CustomerTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Tổng quan' }} />
      <Tabs.Screen name="tickets"   options={{ title: 'Tickets' }} />
      <Tabs.Screen name="profile"   options={{ title: 'Hồ sơ' }} />
    </Tabs>
  );
}
