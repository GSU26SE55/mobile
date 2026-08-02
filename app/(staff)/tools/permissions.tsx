import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { ScreenHeader } from '@/src/shared/components/ScreenHeader';
import { usePermissionCatalog } from '@/src/features/permissions/hooks/usePermissionCatalog';
import { PermissionCatalogList } from '@/src/features/permissions/components/PermissionCatalogList';

// GH-68 — catalog permission read-only cho Staff (trong Công cụ kỹ thuật).
export default function StaffPermissionCatalogScreen() {
  const { data: permissions = [], isLoading } = usePermissionCatalog();

  return (
    <View style={styles.root}>
      <ScreenHeader title="Danh mục quyền" />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <PermissionCatalogList permissions={permissions} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
