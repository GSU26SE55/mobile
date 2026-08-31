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
import { Colors, Shadow } from '@/src/lib/theme';
import { KbCategoryBadge } from '@/src/features/kb/components/KbCategoryBadge';
import { KbDetailSection } from '@/src/features/kb/components/KbDetailSection';
import { KbStepList } from '@/src/features/kb/components/KbStepList';
import { useKbDetail } from '@/src/features/kb/hooks/useKbDetail';
import { useMarkKbHelpful } from '@/src/features/kb/hooks/useMarkKbHelpful';
import { BackButton } from '@/src/shared/components/ScreenHeader';

export default function StaffKbDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const { data: article, isLoading, isError, refetch } = useKbDetail(id);
  const { mutate: markHelpful, isPending: markingHelpful } = useMarkKbHelpful();
  const [markedHelpful, setMarkedHelpful] = useState(false);

  const handleMarkHelpful = () => {
    if (!id || markedHelpful || markingHelpful) return;
    setMarkedHelpful(true);
    // On failure → re-enable the button so the user can retry.
    markHelpful(id, { onError: () => setMarkedHelpful(false) });
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
        <Text style={styles.errorTitle}>Article not found</Text>
        <Text style={styles.errorSub}>
          The article may have been removed or is currently being updated.
        </Text>
        <Pressable
          onPress={() => (id ? refetch() : router.back())}
          style={styles.retryBtn}
        >
          <Text style={styles.retryText}>{id ? 'Retry' : 'Go back'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.code}>{article.code}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, Shadow]}>
          <View style={styles.heroTopRow}>
            <KbCategoryBadge category={article.category} size="md" />
            <View style={[
              styles.visibilityBadge,
              article.isInternalOnly ? styles.visibilityInternal : styles.visibilityPublic,
            ]}>
              <Ionicons
                name={article.isInternalOnly ? 'lock-closed' : 'globe-outline'}
                size={11}
                color={article.isInternalOnly ? '#64748B' : '#059669'}
              />
              <Text style={[
                styles.visibilityText,
                article.isInternalOnly ? styles.visibilityTextInternal : styles.visibilityTextPublic,
              ]}>
                {article.isInternalOnly ? 'Internal' : 'Public'}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{article.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color={Colors.textMute} />
              <Text style={styles.metaText}>{article.viewCount} views</Text>
            </View>
            {article.updatedAt && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textMute} />
                <Text style={styles.metaText}>Updated {formatRelative(article.updatedAt)}</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleMarkHelpful}
            disabled={markedHelpful || markingHelpful}
            style={[styles.helpfulBtn, markedHelpful && styles.helpfulBtnActive]}
          >
            <Ionicons
              name={markedHelpful ? 'thumbs-up' : 'thumbs-up-outline'}
              size={15}
              color={markedHelpful ? Colors.primary : Colors.textMute}
            />
            <Text style={[styles.helpfulText, markedHelpful && styles.helpfulTextActive]}>
              Helpful ({article.helpfulCount})
            </Text>
          </Pressable>
        </View>

        <KbDetailSection
          icon="document-text-outline"
          iconColor={Colors.primaryDark}
          iconBg={Colors.primaryLight}
          title="Content"
        >
          <KbStepList text={article.content} variant="numbered" />
        </KbDetailSection>

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
                      pathname: '/(staff)/kb' as never,
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
    const diffMs = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(diffMs)) return '';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;
    return `${Math.floor(months / 12)} years ago`;
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  visibilityInternal: {
    backgroundColor: 'rgba(100,116,139,0.08)',
    borderColor: 'rgba(100,116,139,0.3)',
  },
  visibilityPublic: {
    backgroundColor: 'rgba(5,150,105,0.08)',
    borderColor: 'rgba(5,150,105,0.3)',
  },
  visibilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  visibilityTextInternal: {
    color: '#64748B',
  },
  visibilityTextPublic: {
    color: '#059669',
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
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
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
