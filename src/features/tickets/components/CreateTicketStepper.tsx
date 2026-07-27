import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TicketCategoryEnum } from '../types/ticket.types';
import type { UploadedTicketAttachment } from '../types/ticket.types';
import { useUploadTicketAttachment } from '../hooks/useUploadTicketAttachment';
import { useMyBatteryAssets } from '../../batteries/hooks/useMyBatteryAssets';
import { BatteryAssetDto } from '../../batteries/types/battery.types';
import { Colors, Shadow, ShadowPrimary } from '../../../lib/theme';

const TOTAL_STEPS = 4;

const BATTERY_STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Active', color: '#2E7D32', bg: '#E8F5E9' },
  2: { label: 'Inactive', color: '#E69A1A', bg: '#FFF3E3' },
  3: { label: 'Ngừng sử dụng', color: '#DC4F3D', bg: '#FFEBEA' },
};

interface Props {
  step: number;
  setStep: (step: number | ((s: number) => number)) => void;
  // Ticket có thể gắn nhiều pin — mảng id đã chọn.
  selectedBatteryIds: string[];
  setSelectedBatteryIds: (ids: string[]) => void;
  category: TicketCategoryEnum | '';
  setCategory: (c: TicketCategoryEnum | '') => void;
  description: string;
  setDescription: (desc: string) => void;
  /** Label chip phát hiện đã chọn ('Vừa xong'...) hoặc '' nếu chưa chọn. */
  detectedLabel: string;
  setDetectedLabel: (label: string) => void;
  attachedFiles: UploadedTicketAttachment[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<UploadedTicketAttachment[]>>;
  onSubmit: () => void;
  isLoading: boolean;
  onCancel: () => void;
}

// Lựa chọn nhanh "phát hiện lúc nào" — tránh thêm datetime picker lib (rule mobile).
// State lưu `label` (định danh ổn định) — KHÔNG lưu ISO trong state vì Date.now()
// đổi mỗi render → so sánh ISO sẽ luôn false (chip không chọn được). ISO tính khi submit.
const DETECTED_OPTIONS: { label: string; minutesAgo: number }[] = [
  { label: 'Vừa xong', minutesAgo: 0 },
  { label: '1 giờ trước', minutesAgo: 60 },
  { label: 'Sáng nay', minutesAgo: 60 * 6 },
  { label: 'Hôm qua', minutesAgo: 60 * 24 },
];

// Parse chuỗi Customer gõ tay "dd/MM/yyyy HH:mm" (hoặc "dd/MM/yyyy HH:mm:ss") → Date.
// Không dùng datetime picker lib (rule mobile) — parse thủ công + validate từng phần.
// Trả null nếu sai format / ngày không hợp lệ / ở tương lai.
export function parseDetectedInput(text: string): Date | null {
  const m = text
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh, min, ss] = m;
  const day = +dd;
  const month = +mm;
  const year = +yyyy;
  const hour = +hh;
  const minute = +min;
  const second = ss ? +ss : 0;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;
  const d = new Date(year, month - 1, day, hour, minute, second);
  // Reject ngày tràn (vd 31/02 → JS auto-rollover sang tháng sau) + thời điểm tương lai.
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day ||
    d.getTime() > Date.now()
  )
    return null;
  return d;
}

/**
 * Map label đã chọn → ISO UTC (tính tại thời điểm gọi). '' nếu không chọn.
 * - Là 1 chip nhanh → tính từ minutesAgo.
 * - Ngược lại coi là chuỗi Customer gõ tay "dd/MM/yyyy HH:mm" → parse.
 */
export function detectedLabelToIso(label: string): string {
  const opt = DETECTED_OPTIONS.find((o) => o.label === label);
  if (opt) return new Date(Date.now() - opt.minutesAgo * 60_000).toISOString();
  const custom = parseDetectedInput(label);
  return custom ? custom.toISOString() : '';
}

// Date → "dd/MM/yyyy HH:mm" (khớp format parseDetectedInput dùng lại được).
export function formatDetected(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const CATEGORIES: { value: TicketCategoryEnum; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; iconBg: string }[] = [
  {
    value: 'Charging',
    label: 'Sự cố sạc',
    sub: 'Không sạc, sạc chậm',
    icon: 'flash-outline',
    iconColor: '#EF5128',
    iconBg: '#FFE5DA',
  },
  {
    value: 'Overheat',
    label: 'Quá nhiệt',
    sub: 'Nhiệt độ vượt ngưỡng',
    icon: 'thermometer-outline',
    iconColor: '#DC4F3D',
    iconBg: '#FFEBEA',
  },
  {
    value: 'NoPower',
    label: 'Mất nguồn',
    sub: 'Không có điện ra',
    icon: 'power-outline',
    iconColor: '#E69A1A',
    iconBg: '#FFF3E3',
  },
  {
    value: 'Other',
    label: 'Khác',
    sub: 'Bảo trì, yêu cầu khác',
    icon: 'information-circle-outline',
    iconColor: '#5081C7',
    iconBg: '#EBF3FF',
  },
];

const getAssetUploadFile = (asset: ImagePicker.ImagePickerAsset) => {
  const uriFileName = asset.uri.split('/').pop();
  const assetFileName = asset.fileName ?? uriFileName;
  const rawExt = assetFileName?.split('.').pop()?.toLowerCase();
  const contentType = rawExt === 'png' || asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  const fallbackExt = contentType === 'image/png' ? 'png' : 'jpg';
  const isAllowedExt = rawExt === 'jpg' || rawExt === 'jpeg' || rawExt === 'png';
  const name = isAllowedExt && assetFileName
    ? assetFileName
    : `ticket-attachment-${Date.now()}.${fallbackExt}`;

  return {
    uri: asset.uri,
    name,
    type: contentType,
  };
};

export function CreateTicketStepper({
  step,
  setStep,
  selectedBatteryIds,
  setSelectedBatteryIds,
  category,
  setCategory,
  description,
  setDescription,
  detectedLabel,
  setDetectedLabel,
  attachedFiles,
  setAttachedFiles,
  onSubmit,
  isLoading,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();

  const { data: batteries = [] } = useMyBatteryAssets();
  const selectedBatteries = batteries.filter((b: BatteryAssetDto) =>
    selectedBatteryIds.includes(b.id),
  );
  const uploadTicketAttachment = useUploadTicketAttachment();
  const isUploadingImage = uploadTicketAttachment.isPending;

  // Date/time picker cho "Phát hiện lúc nào" — chọn ngày rồi giờ, lưu về format cũ.
  const [pickerStage, setPickerStage] = React.useState<'idle' | 'date' | 'time'>('idle');
  const [pendingDate, setPendingDate] = React.useState<Date | null>(null);

  const onDetectedChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) {
      setPickerStage('idle');
      return;
    }
    if (pickerStage === 'date') {
      const base = pendingDate ?? new Date();
      const next = new Date(selected);
      next.setHours(base.getHours(), base.getMinutes(), 0, 0);
      setPendingDate(next);
      setPickerStage('time');
      return;
    }
    // pickerStage === 'time'
    const base = pendingDate ?? new Date();
    const final = new Date(base);
    final.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    // Không cho vượt hiện tại (giờ có thể đẩy quá now dù ngày = hôm nay).
    const clamped = final.getTime() > Date.now() ? new Date() : final;
    setDetectedLabel(formatDetected(clamped));
    setPickerStage('idle');
  };

  const uploadPickedAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const uploadedFiles: UploadedTicketAttachment[] = [];
    let failedCount = 0;

    for (const asset of assets) {
      try {
        const uploaded = await uploadTicketAttachment.mutateAsync(getAssetUploadFile(asset));
        uploadedFiles.push(uploaded);
      } catch {
        failedCount += 1;
      }
    }

    if (uploadedFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...uploadedFiles]);
    }

    if (failedCount > 0) {
      Alert.alert('Error', `${failedCount} image(s) failed to upload. Please try again.`);
    }
  };

  // Image picker
  const pickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền máy ảnh trong cài đặt.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        await uploadPickedAssets([result.assets[0]]);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể khởi động máy ảnh.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền thư viện ảnh trong cài đặt.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets) {
        await uploadPickedAssets(result.assets);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể truy cập thư viện ảnh.');
    }
  };

  const handleAddImage = () => {
    if (isUploadingImage) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Hủy', 'Chụp ảnh', 'Chọn từ thư viện'], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) pickFromCamera();
          if (idx === 2) pickFromGallery();
        }
      );
    } else {
      Alert.alert('Thêm ảnh', '', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: pickFromCamera },
        { text: 'Chọn từ thư viện', onPress: pickFromGallery },
      ]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Header
  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable
        onPress={() => {
          if (step > 1) setStep((s) => s - 1);
          else onCancel();
        }}
        style={styles.headerBack}
      >
        <Ionicons name="chevron-back" size={18} color={Colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>Tạo Ticket · {step}/{TOTAL_STEPS}</Text>
      <Pressable onPress={onCancel} style={styles.headerCancel}>
        <Text style={styles.headerCancelText}>Hủy</Text>
      </Pressable>
    </View>
  );

  // Progress bar
  const renderProgress = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <View
          key={s}
          style={[styles.progressBarSegment, s <= step && styles.progressBarSegmentActive]}
        />
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      // ─── Step 1: Device ───────────────────────────────────────────────
      case 1:
        return (
          <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepNum}>BƯỚC 01</Text>
            <Text style={styles.stepTitle}>Chọn thiết bị</Text>
            <Text style={styles.stepSub}>
              Chọn 1 hoặc nhiều pin gặp sự cố
              {selectedBatteryIds.length > 0 ? ` · đã chọn ${selectedBatteryIds.length}` : ''}
            </Text>

            <View style={styles.batteryList}>
              {batteries.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Ionicons name="battery-dead-outline" size={36} color={Colors.textMute} />
                  <Text style={{ color: Colors.textMute, marginTop: 8, fontSize: 13 }}>No devices found</Text>
                </View>
              )}
              {batteries.map((battery: BatteryAssetDto) => {
                const isSelected = selectedBatteryIds.includes(battery.id);
                const statusInfo = BATTERY_STATUS_MAP[battery.status] ?? { label: 'Unknown', color: Colors.gray, bg: '#F3F4F6' };
                return (
                  <Pressable
                    key={battery.id}
                    style={[styles.batteryCard, isSelected && styles.batteryCardSelected, Shadow]}
                    // Multi-select: toggle pin vào/khỏi danh sách.
                    onPress={() =>
                      setSelectedBatteryIds(
                        isSelected
                          ? selectedBatteryIds.filter((id) => id !== battery.id)
                          : [...selectedBatteryIds, battery.id],
                      )
                    }
                  >
                    <View style={[styles.batteryIconWrap, { backgroundColor: statusInfo.bg }]}>
                      <Ionicons name="battery-charging" size={20} color={statusInfo.color} />
                    </View>
                    <View style={styles.batteryInfo}>
                      <Text style={styles.batteryName}>{battery.batteryTypeName}</Text>
                      <Text style={styles.batterySub}>
                        {battery.serialNumber}{battery.siteName ? ` · ${battery.siteName}` : ''}
                      </Text>
                    </View>
                    <View style={styles.batteryStatusCol}>
                      <Text style={[styles.batteryStatusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                    {/* Checkbox (multi-select) thay radio (single). */}
                    <View style={[styles.checkboxOutline, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        );

      // ─── Step 2: Category + Description (merged) ──────────────────────
      case 2:
        return (
          <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.stepNum}>BƯỚC 02</Text>
            <Text style={styles.stepTitle}>Lý do & Mô tả</Text>
            <Text style={styles.stepSub}>Chọn loại sự cố và mô tả chi tiết</Text>

            {/* Category grid */}
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <Pressable
                    key={cat.value}
                    style={[styles.categoryCard, isSelected && styles.categoryCardSelected, Shadow]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <View style={[styles.categoryIconWrap, { backgroundColor: cat.iconBg }]}>
                      <Ionicons name={cat.icon} size={22} color={cat.iconColor} />
                    </View>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                    <Text style={styles.categorySub}>{cat.sub}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Description */}
            <Text style={styles.descLabel}>Mô tả sự cố</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.multilineInput}
                multiline
                numberOfLines={5}
                maxLength={500}
                placeholder="VD: Pin báo nhiệt độ cao từ 9h sáng. Quạt thông gió vẫn chạy nhưng nhiệt vẫn tăng..."
                placeholderTextColor={Colors.textFaint}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.charCountRow}>
              <Text style={styles.minCharLabel}>Tối thiểu 10 ký tự</Text>
              <Text style={styles.countText}>{description.length}/500</Text>
            </View>

            {/* Thời điểm phát hiện — chip nhanh HOẶC nhập giờ cụ thể. Không cần datetime picker lib. */}
            <Text style={styles.descLabel}>Phát hiện lúc nào? (không bắt buộc)</Text>
            <View style={styles.detectedRow}>
              {DETECTED_OPTIONS.map((opt) => {
                const isSelected = detectedLabel === opt.label;
                return (
                  <Pressable
                    key={opt.label}
                    style={[
                      styles.detectedChip,
                      isSelected && styles.detectedChipSelected,
                    ]}
                    onPress={() =>
                      setDetectedLabel(isSelected ? '' : opt.label)
                    }
                  >
                    <Text
                      style={[
                        styles.detectedChipText,
                        isSelected && styles.detectedChipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Chọn giờ cụ thể qua picker — label KHÔNG khớp chip nào = giá trị tự chọn. */}
            {(() => {
              const isChip = DETECTED_OPTIONS.some((o) => o.label === detectedLabel);
              const customText = isChip ? '' : detectedLabel;
              const hasCustom =
                customText.trim().length > 0 && parseDetectedInput(customText) !== null;
              return (
                <>
                  <Text style={styles.detectedOrLabel}>Hoặc chọn chính xác:</Text>
                  <View style={styles.detectedPickerRow}>
                    <Pressable
                      style={styles.detectedPickerBtn}
                      onPress={() => {
                        setPendingDate(parseDetectedInput(customText) ?? new Date());
                        setPickerStage('date');
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={Colors.textMute}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.detectedPickerText,
                          !hasCustom && { color: Colors.textFaint },
                        ]}
                      >
                        {hasCustom ? customText : 'Chọn ngày & giờ'}
                      </Text>
                    </Pressable>
                    {hasCustom && (
                      <Pressable
                        style={styles.detectedClearBtn}
                        onPress={() => setDetectedLabel('')}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={20} color={Colors.textMute} />
                      </Pressable>
                    )}
                  </View>
                  {pickerStage !== 'idle' && (
                    <DateTimePicker
                      value={pendingDate ?? new Date()}
                      mode={pickerStage}
                      is24Hour
                      maximumDate={new Date()}
                      onChange={onDetectedChange}
                    />
                  )}
                </>
              );
            })()}

            <View style={[styles.infoBanner, { marginBottom: 40 }]}>
              <Ionicons name="information-circle-outline" size={16} color="#2A538A" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.infoBannerText}>
                Bao gồm: <Text style={{ fontWeight: '700' }}>thời gian xảy ra</Text>, hiện tượng, đã thử gì.
              </Text>
            </View>
          </ScrollView>
        );

      // ─── Step 3: Attachment (unlimited) ───────────────────────────────
      case 3:
        return (
          <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepNum}>BƯỚC 03</Text>
            <Text style={styles.stepTitle}>Ảnh đính kèm</Text>
            <Text style={styles.stepSub}>Không giới hạn – giúp KTV chẩn đoán nhanh hơn</Text>

            {/* Added images grid */}
            {attachedFiles.length > 0 && (
              <View style={styles.imageGrid}>
                {attachedFiles.map((file, idx) => (
                  <View key={file.fileId} style={[styles.imageSlot, Shadow]}>
                    <Image source={{ uri: file.uri }} style={styles.imageThumb} />
                    <Pressable style={styles.removeImageBtn} onPress={() => handleRemoveFile(idx)}>
                      <Ionicons name="close-circle" size={20} color="#D32F2F" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Add button — full width, dashed */}
            <Pressable
              style={[styles.addSlot, isUploadingImage && styles.addSlotDisabled]}
              onPress={handleAddImage}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator color={Colors.textMute} />
              ) : (
                <Ionicons name="image-outline" size={36} color={Colors.textMute} />
              )}
              <Text style={styles.addSlotText}>Thêm ảnh</Text>
            </Pressable>

            {attachedFiles.length > 0 && (
              <Text style={styles.imageCountText}>{attachedFiles.length} ảnh đã chọn · không bắt buộc</Text>
            )}
          </ScrollView>
        );

      // ─── Step 4: Review ────────────────────────────────────────────────
      case 4:
        return (
          <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepNum}>BƯỚC 04</Text>
            <Text style={styles.stepTitle}>Xem lại & gửi</Text>
            <Text style={styles.stepSub}>Đội hỗ trợ sẽ tiếp nhận và xử lý</Text>

            {/* Không hiển thị priority gợi ý theo category — priority thật do Manager triage
                (Impact × Urgency), FE gợi ý dễ dạy khách kỳ vọng SLA sai. */}
            <View style={styles.prioritySuggestedCard}>
              <View style={styles.prioritySuggestedBody}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
                <View style={styles.priorityTextCol}>
                  <Text style={styles.priorityTitle}>Mức độ ưu tiên</Text>
                  <Text style={styles.priorityNote}>
                    Được đội hỗ trợ đánh giá sau khi tiếp nhận yêu cầu của bạn.
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.reviewTable, Shadow]}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewRowLabel}>Thiết bị</Text>
                <Text style={styles.reviewRowValue} numberOfLines={2}>
                  {selectedBatteries.length === 0
                    ? 'Không chọn'
                    : selectedBatteries.length === 1
                      ? `${selectedBatteries[0].batteryTypeName} · ${selectedBatteries[0].serialNumber}`
                      : `${selectedBatteries.length} thiết bị: ${selectedBatteries.map((b) => b.serialNumber).join(', ')}`}
                </Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewRow}>
                <Text style={styles.reviewRowLabel}>Loại</Text>
                <Text style={styles.reviewRowValue}>
                  {CATEGORIES.find((c) => c.value === category)?.label ?? 'Khác'}
                </Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewRow}>
                <Text style={styles.reviewRowLabel}>File đính kèm</Text>
                <Text style={styles.reviewRowValue}>{attachedFiles.length} ảnh</Text>
              </View>
            </View>

            <Text style={styles.descSectionTitle}>Mô tả</Text>
            <View style={[styles.reviewDescCard, Shadow]}>
              <Text style={styles.reviewDescText}>{description}</Text>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return selectedBatteryIds.length === 0;
    if (step === 2) return !category || description.length < 10;
    if (step === 3) return isUploadingImage;
    return false;
  };

  return (
    <View style={styles.root}>
      {renderHeader()}
      {renderProgress()}

      <View style={styles.main}>
        {renderStepContent()}
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        {step > 1 ? (
          <Pressable style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </Pressable>
        ) : null}

        {step < TOTAL_STEPS ? (
          <Pressable
            style={[
              styles.continueBtn,
              isNextDisabled() && styles.continueBtnDisabled,
              !isNextDisabled() && ShadowPrimary,
            ]}
            onPress={() => setStep((s) => s + 1)}
            disabled={isNextDisabled()}
          >
            <Text style={styles.continueBtnText}>Tiếp tục</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 6 }} />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.submitBtn, (isLoading || isUploadingImage) && styles.continueBtnDisabled, ShadowPrimary]}
            onPress={onSubmit}
            disabled={isLoading || isUploadingImage}
          >
            <Text style={styles.continueBtnText}>Gửi ticket</Text>
            <Ionicons name="paper-plane" size={14} color="#fff" style={{ marginLeft: 6 }} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  headerCancel: { paddingHorizontal: 8 },
  headerCancelText: { color: Colors.textMute, fontSize: 14, fontWeight: '500' },
  progressContainer: {
    flexDirection: 'row',
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginHorizontal: 16,
    gap: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarSegment: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 1.5,
  },
  progressBarSegmentActive: { backgroundColor: '#EF5128' },
  main: { flex: 1, paddingHorizontal: 20 },
  stepScroll: { flex: 1 },
  stepNum: { fontSize: 11, fontWeight: '700', color: '#EF5128', letterSpacing: 1, marginBottom: 4 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  stepSub: { fontSize: 13, color: Colors.textMute, marginTop: 2, marginBottom: 20 },

  // Battery list
  batteryList: { gap: 12, paddingBottom: 40 },
  batteryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: 'transparent',
  },
  batteryCardSelected: { borderColor: '#EF5128' },
  batteryIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  batteryInfo: { flex: 1, marginRight: 8 },
  batteryName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  batterySub: { fontSize: 10, color: Colors.textMute, marginTop: 2 },
  batteryStatusCol: { alignItems: 'flex-end', marginRight: 12 },
  batteryStatusLabel: { fontSize: 9, fontWeight: '600', marginTop: 1 },
  radioOutline: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF5128' },
  checkboxOutline: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#EF5128', borderColor: '#EF5128' },

  // Category
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  categoryCard: {
    width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 16, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'flex-start',
  },
  categoryCardSelected: { borderColor: '#EF5128' },
  categoryIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  categoryLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  categorySub: { fontSize: 10, color: Colors.textMute, lineHeight: 14 },

  // Description
  descLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 10 },
  detectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  detectedChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card2,
  },
  detectedChipSelected: {
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
  },
  detectedChipText: { fontSize: 13, color: Colors.textMute, fontWeight: '500' },
  detectedChipTextSelected: { color: Colors.text, fontWeight: '700' },
  detectedOrLabel: { fontSize: 12, color: Colors.textMute, marginBottom: 6, marginTop: -8 },
  detectedPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  detectedPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.card,
  },
  detectedPickerText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  detectedClearBtn: { padding: 4 },
  detectedInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 20,
  },
  detectedInputError: { borderColor: '#DC4F3D' },
  detectedInputHint: { fontSize: 12, color: '#DC4F3D', marginTop: -14, marginBottom: 16 },
  inputWrapper: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  multilineInput: { fontSize: 14, color: Colors.text, minHeight: 100 },
  charCountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 2 },
  minCharLabel: { fontSize: 11, color: Colors.textMute },
  countText: { fontSize: 11, color: Colors.textMute },
  infoBanner: {
    flexDirection: 'row', backgroundColor: '#EBF3FF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, alignItems: 'flex-start',
  },
  infoBannerText: { flex: 1, fontSize: 11, color: '#2A538A', lineHeight: 16 },

  // Image grid (unlimited)
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 12 },
  imageSlot: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  imageThumb: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: '#FFFFFF', borderRadius: 10 },
  addSlot: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.25)',
    backgroundColor: 'rgba(0,0,0,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addSlotDisabled: { opacity: 0.65 },
  addSlotText: { fontSize: 13, color: Colors.textMute, fontWeight: '600' },
  imageCountText: { fontSize: 11, color: Colors.textMute, marginTop: 4, paddingBottom: 40 },

  // Review
  prioritySuggestedCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  prioritySuggestedBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priorityTextCol: { flex: 1 },
  priorityTitle: { fontSize: 13, color: Colors.text, fontWeight: '700' },
  priorityNote: { fontSize: 12, color: Colors.textMute, marginTop: 2, lineHeight: 17 },
  reviewTable: { backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, alignItems: 'center' },
  reviewRowLabel: { fontSize: 12, color: Colors.textMute, fontWeight: '500' },
  reviewRowValue: { fontSize: 12, color: Colors.text, fontWeight: '600', maxWidth: '70%' },
  reviewDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
  descSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMute, marginBottom: 8, paddingLeft: 2 },
  reviewDescCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 40 },
  reviewDescText: { fontSize: 13, color: Colors.text, lineHeight: 18 },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  backBtn: { paddingVertical: 13, paddingHorizontal: 20, justifyContent: 'center' },
  backBtnText: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  continueBtn: {
    flex: 1, flexDirection: 'row', backgroundColor: '#EF5128',
    borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', minWidth: 120,
  },
  submitBtn: {
    flex: 1, flexDirection: 'row', backgroundColor: '#EF5128',
    borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
  },
  continueBtnDisabled: { backgroundColor: Colors.border, opacity: 0.65 },
  continueBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
