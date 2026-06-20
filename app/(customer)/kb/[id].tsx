import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '../../../src/lib/theme';
import { KbCategoryBadge } from '../../../src/features/kb/components/KbCategoryBadge';
import { KbDetailSection } from '../../../src/features/kb/components/KbDetailSection';
import { KbStepList } from '../../../src/features/kb/components/KbStepList';
import { useKbDetail } from '../../../src/features/kb/hooks/useKbDetail';
import { useMarkKbHelpful } from '../../../src/features/kb/hooks/useMarkKbHelpful';

export default function KbDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const { data: article, isLoading, isError, refetch } = useKbDetail(id);
  const { mutate: markHelpful, isPending: markingHelpful } = useMarkKbHelpful();
  const [markedHelpful, setMarkedHelpful] = useState(false);

  const handleMarkHelpful = () => {
    if (!id || markedHelpful || markingHelpful) return;
    setMarkedHelpful(true);
    markHelpful(id);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !article) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="document-text-outline" size={36} color={Colors.textFaint} />
        <Text style={styles.errorTitle}>Không tìm thấy bài viết</Text>
        <Text style={styles.errorSub}>
          Có thể bài viết đã được gỡ hoặc đang được cập nhật.
        </Text>
        <Pressable
          onPress={() => (id ? refetch() : router.back())}
          style={styles.retryBtn}
        >
          <Text style={styles.retryText}>
            {id ? 'Thử lại' : 'Quay lại'}
          </Text>
        </Pressable>
      </View>
    );
  }

  const hasParts =
    Array.isArray(article.recommendedParts) &&
    article.recommendedParts.length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.code}>{article.code}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, Shadow]}>
          <KbCategoryBadge category={article.category} size="md" />
          <Text style={styles.title}>{article.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color={Colors.textMute} />
              <Text style={styles.metaText}>{article.viewCount} lượt xem</Text>
            </View>
            {article.updatedAt && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textMute} />
                <Text style={styles.metaText}>
                  Cập nhật {formatRelative(article.updatedAt)}
                </Text>
              </View>
            )}
          </View>

          {/* Helpful button */}
          <Pressable
            onPress={handleMarkHelpful}
            disabled={markedHelpful || markingHelpful}
            style={[
              styles.helpfulBtn,
              (markedHelpful) && styles.helpfulBtnActive,
            ]}
          >
            <Ionicons
              name={markedHelpful ? 'thumbs-up' : 'thumbs-up-outline'}
              size={15}
              color={markedHelpful ? Colors.primary : Colors.textMute}
            />
            <Text style={[styles.helpfulText, markedHelpful && styles.helpfulTextActive]}>
              Hữu ích ({article.helpfulCount})
            </Text>
          </Pressable>
        </View>

        <KbDetailSection
          icon="alert-circle-outline"
          iconColor="#B73221"
          iconBg="#FAD9D2"
          title="Triệu chứng"
        >
          <Text style={styles.bodyText}>{article.symptoms}</Text>
        </KbDetailSection>

        <KbDetailSection
          icon="search-outline"
          iconColor="#946011"
          iconBg="#FBE6C2"
          title="Cách chẩn đoán"
        >
          <KbStepList text={article.diagnosisSteps} variant="numbered" />
        </KbDetailSection>

        <KbDetailSection
          icon="checkmark-circle-outline"
          iconColor={Colors.primaryDark}
          iconBg={Colors.primaryLight}
          title="Hướng giải quyết"
        >
          <KbStepList
            text={article.solutionSteps}
            variant="numbered"
            emphasis
          />
        </KbDetailSection>

        {hasParts && (
          <KbDetailSection
            icon="construct-outline"
            iconColor="#1E6F84"
            iconBg="#D6EDF3"
            title="Linh kiện đề xuất"
          >
            <View style={styles.partsList}>
              {article.recommendedParts!.map((part, idx) => (
                <View key={idx} style={styles.partItem}>
                  <Ionicons
                    name="ellipse"
                    size={6}
                    color={Colors.primary}
                  />
                  <Text style={styles.partText}>{part}</Text>
                </View>
              ))}
            </View>
          </KbDetailSection>
        )}

        {article.tags.length > 0 && (
          <View style={styles.tagsWrap}>
            <Text style={styles.tagsLabel}>Tags</Text>
            <View style={styles.tagsRow}>
              {article.tags.map((tag) => (
                <Pressable
                  key={tag}
                  style={styles.tagPill}
                  onPress={() =>
                    router.push({
                      pathname: '/(customer)/kb' as never,
                      params: { tag } as never,
                    } as never)
                  }
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const diffMs = Date.now() - then;
    if (Number.isNaN(diffMs)) return '';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;
    return `${Math.floor(months / 12)} năm trước`;
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMute,
    letterSpacing: 0.5,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMute,
    fontWeight: '500',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
  },
  partsList: {
    gap: 8,
  },
  partItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  partText: {
    fontSize: 14,
    color: Colors.text,
  },
  tagsWrap: {
    marginTop: 8,
    paddingHorizontal: 2,
    gap: 8,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMute,
    letterSpacing: 0.3,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: Colors.card2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 11,
    color: Colors.text2,
    fontWeight: '500',
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card2,
    marginTop: 4,
  },
  helpfulBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  helpfulText: {
    fontSize: 13,
    color: Colors.textMute,
    fontWeight: '600',
  },
  helpfulTextActive: {
    color: Colors.primary,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  errorSub: {
    fontSize: 13,
    color: Colors.textMute,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  retryText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
