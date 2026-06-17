import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '../../../lib/theme';
import { useKbArticle } from '../hooks/useKbArticle';
import { useMarkHelpful } from '../hooks/useMarkHelpful';

const CATEGORY_LABEL: Record<string, string> = {
  Charging: 'Sạc pin',
  Overheat: 'Quá nhiệt',
  NoPower: 'Mất điện',
  Performance: 'Hiệu suất',
  Repair: 'Sửa chữa',
  Other: 'Khác',
};

function Section({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  if (!body) return null;
  return (
    <View style={[styles.card, Shadow]}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={15} color={Colors.primaryDark} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.bodyText}>{body}</Text>
    </View>
  );
}

export default function KbDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: article, isLoading, isError, refetch } = useKbArticle(id ?? '');
  const { mutate: markHelpful, isPending } = useMarkHelpful(id ?? '');
  const [voted, setVoted] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !article) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={32} color={Colors.textFaint} />
        <Text style={styles.emptyText}>Không tìm thấy bài viết.</Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Thử lại</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const handleHelpful = () => {
    if (voted || isPending) return;
    setVoted(true);
    markHelpful();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.topCode} numberOfLines={1}>{article.code}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.titleCard, Shadow]}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{CATEGORY_LABEL[article.category] ?? article.category}</Text>
          </View>
          <Text style={styles.title}>{article.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={13} color={Colors.textMute} />
              <Text style={styles.metaText}>{article.viewCount} lượt xem</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="thumbs-up-outline" size={13} color={Colors.textMute} />
              <Text style={styles.metaText}>{article.helpfulCount} hữu ích</Text>
            </View>
          </View>
        </View>

        <Section icon="alert-circle-outline" title="Triệu chứng" body={article.symptoms} />
        <Section icon="search-outline" title="Các bước chẩn đoán" body={article.diagnosisSteps} />
        <Section icon="construct-outline" title="Cách xử lý" body={article.solutionSteps} />

        {article.recommendedParts && article.recommendedParts.length > 0 && (
          <View style={[styles.card, Shadow]}>
            <View style={styles.sectionHead}>
              <Ionicons name="cube-outline" size={15} color={Colors.primaryDark} />
              <Text style={styles.sectionTitle}>Linh kiện khuyến nghị</Text>
            </View>
            {article.recommendedParts.map((part, i) => (
              <View key={`${part}-${i}`} style={styles.partRow}>
                <View style={styles.partDot} />
                <Text style={styles.partText}>{part}</Text>
              </View>
            ))}
          </View>
        )}

        {article.tags.length > 0 && (
          <View style={styles.tagRow}>
            {article.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Helpful */}
        <Pressable
          style={[styles.helpfulBtn, voted && styles.helpfulBtnVoted]}
          onPress={handleHelpful}
          disabled={voted || isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={Colors.primaryDark} />
          ) : (
            <Ionicons name={voted ? 'thumbs-up' : 'thumbs-up-outline'} size={16} color={voted ? Colors.primaryDark : Colors.text} />
          )}
          <Text style={[styles.helpfulText, voted && styles.helpfulTextVoted]}>
            {voted ? 'Cảm ơn phản hồi của bạn' : 'Bài viết này hữu ích'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, gap: 10 },
  emptyText: { color: Colors.textMute, fontSize: 14 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  retryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  backLink: { marginTop: 4 },
  backLinkText: { color: Colors.textMute, fontSize: 13, fontWeight: '600' },

  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
  },
  topCode: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', color: Colors.text },

  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
  titleCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '700', color: Colors.primaryDark },
  title: { fontSize: 19, fontWeight: '800', color: Colors.text, lineHeight: 26, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textMute, fontWeight: '600' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  bodyText: { fontSize: 13, color: Colors.text2, lineHeight: 22, fontWeight: '500' },

  partRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  partDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.primary },
  partText: { fontSize: 13, color: Colors.text2, fontWeight: '600' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: Colors.card2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tagText: { fontSize: 11, color: Colors.textMute, fontWeight: '700' },

  helpfulBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  helpfulBtnVoted: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  helpfulText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  helpfulTextVoted: { color: Colors.primaryDark },
});
