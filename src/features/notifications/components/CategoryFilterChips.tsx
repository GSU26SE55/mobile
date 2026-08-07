import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { NotificationCategoryEnum } from '../enums/notification.enum';

// `null` = "Tất cả" (không lọc). Dùng null thay vì một giá trị enum giả để không đụng dải giá trị BE.
export type CategoryFilter = NotificationCategoryEnum | null;

// Thứ tự hiển thị = thứ tự giá trị enum của BE, giữ nguyên để khớp màn cài đặt nhóm.
const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: null, label: 'Tất cả' },
  { key: NotificationCategoryEnum.Ticket, label: 'Ticket' },
  { key: NotificationCategoryEnum.Sla, label: 'SLA' },
  { key: NotificationCategoryEnum.Battery, label: 'Pin' },
  { key: NotificationCategoryEnum.Environmental, label: 'Môi trường' },
  { key: NotificationCategoryEnum.Chat, label: 'Trao đổi' },
  { key: NotificationCategoryEnum.Account, label: 'Tài khoản' },
];

interface Props {
  value: CategoryFilter;
  onChange: (next: CategoryFilter) => void;
  /** Số dòng của mỗi nhóm trong phần đã tải — nhóm không có dòng nào vẫn hiện, chỉ làm mờ. */
  counts: Record<string, number>;
  total: number;
}

export function CategoryFilterChips({ value, onChange, counts, total }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {CATEGORY_TABS.map((tab) => {
        const count = tab.key === null ? total : (counts[String(tab.key)] ?? 0);
        const active = value === tab.key;
        return (
          <Pressable
            key={String(tab.key)}
            style={[styles.chip, active && styles.chipActive, !active && count === 0 && styles.chipEmpty]}
            onPress={() => onChange(tab.key)}
          >
            <Text
              style={[styles.text, active && styles.textActive]}
              numberOfLines={1}
            >
              {tab.label} ({count})
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Không set marginHorizontal âm ở đây — component tự nằm trong vùng có lề của màn hình cha,
  // lề trái/phải do `row` cấp để chip cuộn sát mép mà vẫn có khoảng thở ở hai đầu.
  scroll: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  // Nhóm rỗng vẫn bấm được (trang sau có thể có) — chỉ giảm nổi bật, không disable.
  chipEmpty: { opacity: 0.45 },
  text: { fontSize: 12, fontWeight: '600', color: Colors.textMute },
  textActive: { color: '#FFFFFF', fontWeight: '800' },
});
