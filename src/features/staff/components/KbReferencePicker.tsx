import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '../../../lib/theme';
import { KbReferenceTypeEnum, KbReferenceTypeLabel } from '../../../shared/enums/kb.enum';
import { useKbSuggest } from '../../kb/hooks/useKbSuggest';
import { useAddKbRef } from '../../kb/hooks/useAddKbRef';
import { KbSuggestCard } from '../../kb/components/KbSuggestCard';

interface Props {
  visible: boolean;
  ticketId: string;
  onClose: () => void;
}

const REF_TYPES = [
  KbReferenceTypeEnum.ConsultedDuringResolve,
  KbReferenceTypeEnum.ProvidedToCustomer,
  KbReferenceTypeEnum.GeneratedAfterResolve,
] as const;

// GH-44 #5/#7 — chọn bài KB gợi ý theo ticket rồi gán làm reference.
export function KbReferencePicker({ visible, ticketId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { data: suggestions = [], isLoading } = useKbSuggest(visible ? ticketId : undefined);
  const { mutate: addRef } = useAddKbRef(ticketId);
  const [refType, setRefType] = useState<KbReferenceTypeEnum>(KbReferenceTypeEnum.ConsultedDuringResolve);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleAssign = (kbArticleId: string) => {
    setPendingId(kbArticleId);
    addRef(
      { ticketId, kbArticleId, referenceType: refType },
      {
        onSuccess: () => { setPendingId(null); onClose(); },
        onError: () => setPendingId(null),
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Gán bài viết KB</Text>

          {/* Chọn loại tham chiếu */}
          <Text style={styles.label}>Loại tham chiếu</Text>
          <View style={styles.typeRow}>
            {REF_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[styles.typeChip, refType === t && styles.typeChipOn]}
                onPress={() => setRefType(t)}
              >
                <Text style={[styles.typeChipText, refType === t && styles.typeChipTextOn]}>
                  {KbReferenceTypeLabel[t]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Gợi ý theo ticket</Text>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {isLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
            ) : suggestions.length === 0 ? (
              <Text style={styles.empty}>Không có gợi ý phù hợp.</Text>
            ) : (
              suggestions.map((a) => (
                <KbSuggestCard
                  key={a.id}
                  article={a}
                  rightSlot={
                    <Pressable
                      style={[styles.assignBtn, Shadow]}
                      onPress={() => handleAssign(a.id)}
                      disabled={pendingId !== null}
                    >
                      {pendingId === a.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Ionicons name="add" size={18} color="#FFF" />
                      )}
                    </Pressable>
                  }
                />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: '80%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMute, marginTop: 8, marginBottom: 6 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  typeChipOn: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  typeChipText: { fontSize: 12, color: Colors.textMute, fontWeight: '600' },
  typeChipTextOn: { color: Colors.primary },
  list: { marginTop: 4 },
  empty: { color: Colors.textFaint, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
  assignBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});
