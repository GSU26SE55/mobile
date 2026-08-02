import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { usePermissionCatalog } from '@/src/features/permissions/hooks/usePermissionCatalog';
import { PermissionCatalogList } from '@/src/features/permissions/components/PermissionCatalogList';

// GH-68 — catalog permission read-only (mọi role). Header từ settings/_layout Stack.
export default function PermissionCatalogScreen() {
  const { data: permissions = [], isLoading } = usePermissionCatalog();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <PermissionCatalogList permissions={permissions} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
});
