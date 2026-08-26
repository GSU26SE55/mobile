import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { PermissionDto } from '../types/permission.types';

interface Props {
  permissions: PermissionDto[];
}

// GH-68 — read-only permission catalog, grouped by module.
export function PermissionCatalogList({ permissions }: Props) {
  const sections = useMemo(() => {
    const byModule = new Map<string, PermissionDto[]>();
    for (const p of permissions) {
      const arr = byModule.get(p.module) ?? [];
      arr.push(p);
      byModule.set(p.module, arr);
    }
    return Array.from(byModule.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, data]) => ({ title: module, data }));
  }, [permissions]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.code}>{item.code}</Text>
          {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No permissions yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: Colors.primaryDark,
    marginTop: 16, marginBottom: 6, textTransform: 'uppercase',
  },
  item: {
    backgroundColor: Colors.card, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
  },
  code: { fontSize: 13, fontWeight: '600', color: Colors.text },
  desc: { fontSize: 12, color: Colors.textMute, marginTop: 2 },
  empty: { fontSize: 13, color: Colors.textMute, textAlign: 'center', marginTop: 40 },
});
