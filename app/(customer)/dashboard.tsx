import { View, Text, StyleSheet } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Tổng quan hệ thống pin của bạn</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:     { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle:  { fontSize: 14, color: '#666', marginTop: 8 },
});
