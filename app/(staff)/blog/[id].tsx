import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../src/lib/theme';
import { HttpError } from '../../../src/lib/errors';
import { BlogContent } from '../../../src/features/blog/components/BlogContent';
import { BlogEmptyState } from '../../../src/features/blog/components/BlogEmptyState';
import { useBlogDetail } from '../../../src/features/blog/hooks/useBlogDetail';
import { BlogOriginLabel } from '../../../src/features/blog/enums/blog.enum';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export default function StaffBlogDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useBlogDetail(id);

  // BE trả 404 khi bài không ở trạng thái Published (Draft/Archived/đã gỡ).
  // Lỗi khác (mất mạng, 5xx) KHÔNG phải "bài đã gỡ" — phải cho thử lại.
  const isNotFound = error instanceof HttpError && error.statusCode === 404;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Tin tức
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        isNotFound ? (
          <BlogEmptyState variant="notFound" />
        ) : (
          <View style={styles.errorWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color={Colors.textFaint} />
            <Text style={styles.errorTitle}>Không tải được bài viết</Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Thử lại</Text>
            </Pressable>
          </View>
        )
      ) : !data ? (
        <BlogEmptyState variant="notFound" />
      ) : (
        // WebView tự cuộn nội dung → phần tiêu đề đứng yên, không bọc ScrollView.
        <View style={styles.body}>
          <View style={styles.headBlock}>
            <Text style={styles.title}>{data.title}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>{BlogOriginLabel[data.origin]}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.meta}>{formatDate(data.createdAt)}</Text>
            </View>

            {data.summary.length > 0 && (
              <Text style={styles.summary}>{data.summary}</Text>
            )}

            <View style={styles.divider} />
          </View>

          <BlogContent html={data.contentHtml} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  headerSpacer: { width: 36 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorWrap: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  body: { flex: 1 },
  headBlock: { paddingHorizontal: 20 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 30,
    marginBottom: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  meta: { fontSize: 12, fontWeight: '600', color: Colors.textMute },
  metaDot: { fontSize: 12, color: Colors.textFaint },
  summary: {
    fontSize: 14,
    color: Colors.textMute,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 18,
  },
});
