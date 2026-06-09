import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TicketCategoryEnum, TicketPriorityEnum } from '../types/ticket.types';
import { useMyBatteryAssets } from '../../batteries/hooks/useMyBatteryAssets';
import { BatteryAssetDto } from '../../batteries/types/battery.types';
import { Colors, Shadow, ShadowPrimary } from '../../../lib/theme';

const BATTERY_STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Active', color: '#2E7D32', bg: '#E8F5E9' },
  2: { label: 'Inactive', color: '#E69A1A', bg: '#FFF3E3' },
  3: { label: 'Failed', color: '#DC4F3D', bg: '#FFEBEA' },
};

interface Props {
  step: number;
  setStep: (step: number | ((s: number) => number)) => void;
  selectedBatteryId: string | null;
  setSelectedBatteryId: (id: string | null) => void;
  category: TicketCategoryEnum | '';
  setCategory: (c: TicketCategoryEnum | '') => void;
  description: string;
  setDescription: (desc: string) => void;
  attachedFiles: string[];
  setAttachedFiles: (files: string[] | ((f: string[]) => string[])) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onCancel: () => void;
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

export function CreateTicketStepper({
  step,
  setStep,
  selectedBatteryId,
  setSelectedBatteryId,
  category,
  setCategory,
  description,
  setDescription,
  attachedFiles,
  setAttachedFiles,
  onSubmit,
  isLoading,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();

  // Priority calculation
  const getSuggestedPriority = (): { key: TicketPriorityEnum; label: string; time: string; color: string; bg: string } => {
    if (category === 'Overheat' || category === 'NoPower') {
      return { key: 'P1Critical', label: 'P1', time: '< 2h', color: '#DC4F3D', bg: '#FFEBEA' };
    }
    if (category === 'Charging') {
      return { key: 'P2High', label: 'P2', time: '< 8h', color: '#EF5128', bg: '#FFE5DA' };
    }
    return { key: 'P3Normal', label: 'P3', time: '< 24h', color: '#5081C7', bg: '#EBF3FF' };
  };

  const priorityInfo = getSuggestedPriority();

  const { data: batteries = [] } = useMyBatteryAssets();
  const selectedBattery = batteries.find((b: BatteryAssetDto) => b.id === selectedBatteryId);

  // File picker handlers
  const handleLaunchCamera = async () => {
    if (attachedFiles.length >= 5) {
      Alert.alert('Giới hạn', 'Bạn chỉ được đính kèm tối đa 5 ảnh.');
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập máy ảnh trong cài đặt.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setAttachedFiles((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể khởi động máy ảnh.');
    }
  };

  const handleLaunchGallery = async () => {
    if (attachedFiles.length >= 5) {
      Alert.alert('Giới hạn', 'Bạn chỉ được đính kèm tối đa 5 ảnh.');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh trong cài đặt.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - attachedFiles.length,
        quality: 0.7,
      });
      if (!result.canceled && result.assets) {
        const uris = result.assets.map((a) => a.uri);
        setAttachedFiles((prev) => [...prev, ...uris].slice(0, 5));
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể truy cập thư viện ảnh.');
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Stepper Header
  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (step > 1) {
              setStep((s) => s - 1);
            } else {
              onCancel();
            }
          }}
          style={styles.headerBack}
        >
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Tạo Ticket · {step}/6</Text>
        <Pressable onPress={onCancel} style={styles.headerCancel}>
          <Text style={styles.headerCancelText}>Hủy</Text>
        </Pressable>
      </View>
    );
  };

  // Stepper Progress Bar
  const renderProgress = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((s) => (
          <View
            key={s}
            style={[
              styles.progressBarSegment,
              s <= step && styles.progressBarSegmentActive,
            ]}
          />
        ))}
      </View>
    );
  };

  // Render Steps
  const renderStepContent = () => {
    switch (step) {
      case 1: // Device selection
        return (
          <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepNum}>BƯỚC 01</Text>
            <Text style={styles.stepTitle}>Chọn thiết bị</Text>
            <Text style={styles.stepSub}>Ticket gắn với 1 battery (BR-01)</Text>

            <View style={styles.batteryList}>
              {batteries.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Ionicons name="battery-dead-outline" size={36} color={Colors.textMute} />
                  <Text style={{ color: Colors.textMute, marginTop: 8, fontSize: 13 }}>No devices found</Text>
                </View>
              )}
              {batteries.map((battery: BatteryAssetDto) => {
                const isSelected = selectedBatteryId === battery.id;
                const statusInfo = BATTERY_STATUS_MAP[battery.status] ?? { label: 'Unknown', color: Colors.gray, bg: '#F3F4F6' };

                return (
                  <Pressable
                    key={battery.id}
                    style={[styles.batteryCard, isSelected && styles.batteryCardSelected, Shadow]}
                    onPress={() => setSelectedBatteryId(battery.id)}
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
                    <View style={styles.radioOutline}>
                      {isSelected && <View style={styles.radioSelected} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        );

      case 2: // Issue category selection
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepNum}>BƯỚC 02</Text>
            <Text style={styles.stepTitle}>Loại sự cố</Text>
            <Text style={styles.stepSub}>Hệ thống dùng để tính priority</Text>

            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <Pressable
                    key={cat.value}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                      Shadow,
                    ]}
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
          </View>
        );

      case 3: // Description
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepNum}>BƯỚC 03</Text>
            <Text style={styles.stepTitle}>Mô tả chi tiết</Text>
            <Text style={styles.stepSub}>Mô tả càng cụ thể, xử lý càng nhanh</Text>

            <Text style={styles.inputLabel}>Sự cố xảy ra như thế nào?</Text>
            
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.multilineInput}
                multiline
                numberOfLines={6}
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

            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#2A538A" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.infoBannerText}>
                Bao gồm: <Text style={{ fontWeight: '700' }}>thời gian xảy ra</Text>, hiện tượng, có ngắt mạch chưa, đã thử gì.
              </Text>
            </View>
          </View>
        );

      case 4: // Attachment
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepNum}>BƯỚC 04</Text>
            <Text style={styles.stepTitle}>Ảnh / video</Text>
            <Text style={styles.stepSub}>Tối đa 5 file – giúp KTV chẩn đoán</Text>

            <View style={styles.attachmentGrid}>
              {[0, 1, 2, 3, 4].map((idx) => {
                const fileUri = attachedFiles[idx];
                return (
                  <View key={idx} style={[styles.attachmentSlot, Shadow]}>
                    {fileUri ? (
                      <>
                        <Image source={{ uri: fileUri }} style={styles.attachmentImg} />
                        <Pressable style={styles.removeFileBtn} onPress={() => handleRemoveFile(idx)}>
                          <Ionicons name="close-circle" size={18} color="#D32F2F" />
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        style={styles.emptySlot}
                        onPress={handleLaunchGallery}
                      >
                        <Ionicons name="add" size={20} color={Colors.textMute} />
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.pickerActions}>
              <Pressable style={styles.pickerBtn} onPress={handleLaunchCamera}>
                <Ionicons name="camera-outline" size={18} color={Colors.text} style={{ marginRight: 6 }} />
                <Text style={styles.pickerBtnText}>Camera</Text>
              </Pressable>
              
              <Pressable style={styles.pickerBtn} onPress={handleLaunchGallery}>
                <Ionicons name="images-outline" size={18} color={Colors.text} style={{ marginRight: 6 }} />
                <Text style={styles.pickerBtnText}>Thư viện</Text>
              </Pressable>
            </View>
            
            <Text style={styles.attachmentCountText}>{attachedFiles.length} / 5 file - không bắt buộc</Text>
          </View>
        );

      case 5: // Review & send
        return (
          <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepNum}>BƯỚC 05</Text>
            <Text style={styles.stepTitle}>Xem lại & gửi</Text>
            <Text style={styles.stepSub}>Priority hệ thống tính tự động</Text>

            {/* Suggested Priority Card */}
            <View style={styles.prioritySuggestedCard}>
              <Text style={styles.prioritySuggestedLabel}>PRIORITY GỢI Ý</Text>
              <View style={styles.prioritySuggestedBody}>
                <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.bg }]}>
                  <Text style={[styles.priorityBadgeText, { color: priorityInfo.color }]}>
                    {priorityInfo.label}
                  </Text>
                </View>
                <View style={styles.priorityTextCol}>
                  <Text style={styles.priorityTitle}>Phản hồi dự kiến</Text>
                  <Text style={styles.priorityTimeText}>{priorityInfo.time}</Text>
                </View>
              </View>
            </View>

            {/* Info Review Table */}
            <View style={[styles.reviewTable, Shadow]}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewRowLabel}>Thiết bị</Text>
                <Text style={styles.reviewRowValue} numberOfLines={1}>
                  {selectedBattery ? `${selectedBattery.batteryTypeName} · ${selectedBattery.serialNumber}` : 'Không chọn'}
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
                <Text style={styles.reviewRowValue}>{attachedFiles.length} file</Text>
              </View>
            </View>

            {/* Description card */}
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

  // Next / Continue button disabled checks
  const isNextDisabled = () => {
    if (step === 1) return !selectedBatteryId;
    if (step === 2) return !category;
    if (step === 3) return description.length < 10;
    return false;
  };

  return (
    <View style={styles.root}>
      {renderHeader()}
      {renderProgress()}
      
      <View style={styles.main}>
        {renderStepContent()}
      </View>

      {/* Bottom control actions */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
      >
        {step > 1 ? (
          <Pressable style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </Pressable>
        ) : null}

        {step < 5 ? (
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
            style={[styles.submitBtn, isLoading && styles.continueBtnDisabled, ShadowPrimary]}
            onPress={onSubmit}
            disabled={isLoading}
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
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  headerCancel: {
    paddingHorizontal: 8,
  },
  headerCancelText: {
    color: Colors.textMute,
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
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
  progressBarSegmentActive: {
    backgroundColor: '#EF5128',
  },
  main: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepScroll: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF5128',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  stepSub: {
    fontSize: 13,
    color: Colors.textMute,
    marginTop: 2,
    marginBottom: 20,
  },
  batteryList: {
    gap: 12,
    paddingBottom: 40,
  },
  batteryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  batteryCardSelected: {
    borderColor: '#EF5128',
  },
  batteryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  batteryInfo: {
    flex: 1,
    marginRight: 8,
  },
  batteryName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  batterySub: {
    fontSize: 10,
    color: Colors.textMute,
    marginTop: 2,
  },
  batteryStatusCol: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  batterySoc: {
    fontSize: 13,
    fontWeight: '700',
  },
  batteryStatusLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  radioOutline: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF5128',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'flex-start',
  },
  categoryCardSelected: {
    borderColor: '#EF5128',
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  categorySub: {
    fontSize: 10,
    color: Colors.textMute,
    lineHeight: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  multilineInput: {
    fontSize: 14,
    color: Colors.text,
    minHeight: 110,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  minCharLabel: {
    fontSize: 11,
    color: Colors.textMute,
  },
  countText: {
    fontSize: 11,
    color: Colors.textMute,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EBF3FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#2A538A',
    lineHeight: 16,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  attachmentSlot: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  emptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentImg: {
    width: '100%',
    height: '100%',
  },
  removeFileBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    paddingVertical: 11,
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  attachmentCountText: {
    fontSize: 11,
    color: Colors.textMute,
    textAlign: 'center',
    marginTop: 6,
  },
  prioritySuggestedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    flexDirection: 'column',
  },
  prioritySuggestedLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMute,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  prioritySuggestedBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  priorityBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  priorityTextCol: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: 11,
    color: Colors.textMute,
    fontWeight: '500',
  },
  priorityTimeText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 1,
  },
  reviewTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewRowLabel: {
    fontSize: 12,
    color: Colors.textMute,
    fontWeight: '500',
  },
  reviewRowValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
    maxWidth: '70%',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  descSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMute,
    marginBottom: 8,
    paddingLeft: 2,
  },
  reviewDescCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
  },
  reviewDescText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  backBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EF5128',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EF5128',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.65,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
