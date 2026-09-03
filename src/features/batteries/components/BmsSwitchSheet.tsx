import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { formatDateTime } from "@/src/lib/date";
import { Colors, Radius, Solar } from "@/src/lib/theme";
import { HttpError } from "@/src/lib/errors";
import type { CascadeRiskDto } from "../types/cascade.types";
import {
  BmsSwitchCommandStatus,
  BmsSwitchTarget,
} from "../enums/bms-switch.enum";
import type { SetBmsSwitchPayload } from "../types/bms-switch.types";
import { useBmsSwitch } from "../hooks/useBmsSwitch";
import { useSetBmsSwitch } from "../hooks/useSetBmsSwitch";

interface Props {
  assetId: string;
  cascade: CascadeRiskDto | null | undefined;
  visible: boolean;
  onClose: () => void;
}

// Đường cong của iOS sheet: bật lên dứt khoát, gần như không nảy. Đóng thì nhanh và
// ease-in — rời đi không cần được nhìn kỹ như lúc xuất hiện.
const SHEET_SPRING = { damping: 30, stiffness: 260, mass: 0.9 } as const;
const SHEET_OUT = { duration: 220, easing: Easing.in(Easing.cubic) } as const;
const SCREEN_H = Dimensions.get("window").height;

const FAILED_STATUSES = new Set<number>([
  BmsSwitchCommandStatus.Failed,
  BmsSwitchCommandStatus.Rejected,
  BmsSwitchCommandStatus.Unknown,
  BmsSwitchCommandStatus.TimedOut,
]);

/** Kết quả của MỘT lần bấm — "Both" là hai lệnh nhưng vẫn chỉ là một lượt. */
interface Batch {
  enable: boolean;
  /** MOSFET lượt này phải đổi được. Vế nào gửi hỏng thì rút khỏi đây. */
  targets: BmsSwitchTarget[];
  /** cmdId đã gửi được, theo thứ tự. Phần tử cuối là lệnh chốt lượt. */
  issued: string[];
  /** true khi đã gửi xong TOÀN BỘ lượt — trước đó tuyệt đối không được kết luận. */
  sealed: boolean;
  failures: string[];
}

/**
 * Thumb TRƯỢT sang ô được chọn thay vì nhảy nền từ ô này sang ô kia. Vị trí mới đi qua
 * `withSpring` ngay trong style nên chỉ cần `index` đổi là nó tự chạy.
 */
function Segment<T extends string | boolean>({
  options,
  value,
  disabled,
  onChange,
}: {
  options: readonly {
    value: T;
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    tint?: string;
    /** Ô này không làm được gì (đang ở sẵn trạng thái đó) → mờ đi, không bấm được. */
    disabled?: boolean;
  }[];
  value: T;
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const itemW = width > 0 ? (width - 8) / options.length : 0;

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(index * itemW, SHEET_SPRING) }],
  }));

  return (
    <View
      style={styles.segment}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {itemW > 0 ? (
        <Animated.View
          style={[styles.segmentThumb, { width: itemW }, thumbStyle]}
        />
      ) : null}

      {options.map((option) => {
        const selected = option.value === value;
        const off = disabled || !!option.disabled;
        return (
          <Pressable
            key={String(option.value)}
            style={styles.segmentItem}
            disabled={off}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: off }}
            onPress={() => onChange(option.value)}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon}
                size={14}
                color={
                  selected ? (option.tint ?? Colors.accent) : Colors.textMute
                }
                style={off && styles.segmentTextOff}
              />
            ) : null}
            <Text
              style={[
                styles.segmentText,
                selected && styles.segmentTextOn,
                off && styles.segmentTextOff,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function isUnsupportedReason(reason: string | null | undefined): boolean {
  const normalized = reason?.toLowerCase() ?? "";
  return (
    normalized.includes("unsupported") ||
    normalized.includes("not support") ||
    normalized.includes("verify")
  );
}

function formatUpdatedAt(value: string | null | undefined): string {
  if (!value) return "No reading yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No reading yet";
  return `Updated ${formatDateTime(date)}`;
}

function commandFailureMessage(status: number): string {
  if (status === BmsSwitchCommandStatus.Rejected)
    return "The battery refused the change.";
  if (status === BmsSwitchCommandStatus.Unknown)
    return "The battery did not recognise the request.";
  if (status === BmsSwitchCommandStatus.TimedOut)
    return "The battery did not answer in time.";
  return "The change did not go through.";
}

function targetLabel(target: BmsSwitchTarget): string {
  if (target === BmsSwitchTarget.All) return "both";
  return target === BmsSwitchTarget.Discharge ? "discharge" : "charge";
}

// Nhãn On/Off VIẾT RA chứ không chỉ đổi màu — trạng thái phải đọc được với người mù màu.
function stateLabel(
  value: boolean | null | undefined,
  pending: boolean,
): string {
  if (pending) return "Waiting…";
  if (value == null) return "Unknown";
  return value ? "On" : "Off";
}

function consequenceText(target: BmsSwitchTarget, enable: boolean): string {
  if (target === BmsSwitchTarget.All) {
    return enable
      ? "The battery can charge and power the load again."
      : "The battery stops charging and stops powering the load.";
  }
  if (target === BmsSwitchTarget.Discharge) {
    return enable
      ? "The battery can power the load again."
      : "The load loses power. The battery can still charge.";
  }
  return enable
    ? "The battery can charge again."
    : "The battery stops charging. It can still power the load.";
}

// Bottom sheet opened by the lightning button on the battery hero. Same control and
// confirmation flow the web popover uses — the sheet is only the shell, so the safety
// rules (verified readback, high-risk confirmation) stay identical across platforms.
export function BmsSwitchSheet({ assetId, cascade, visible, onClose }: Props) {
  void cascade;
  const stateQuery = useBmsSwitch(assetId);
  const mutation = useSetBmsSwitch(assetId);
  const [confirmation, setConfirmation] = useState<SetBmsSwitchPayload | null>(
    null,
  );
  // Mặc định trùng web: cắt TẤT CẢ. Đó là ca khẩn cấp mà người ta mở control này ra để làm.
  const [pickTarget, setPickTarget] = useState<BmsSwitchTarget>(
    BmsSwitchTarget.All,
  );
  const [pickEnable, setPickEnable] = useState(false);
  // Cả lượt là một thao tác: nút phải khoá luôn trong 1.2s chờ giữa hai lệnh, lúc đó không có
  // `mutation.isPending` lẫn `pendingCommand` nào để suy ra.
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sheet phải sống lâu hơn prop `visible` một nhịp, nếu không nó biến mất ngay lúc bắt đầu
  // chạy animation đóng.
  const [mounted, setMounted] = useState(visible);
  const sheetH = useSharedValue(SCREEN_H);
  const ty = useSharedValue(SCREEN_H);
  const measured = useRef(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Lần mở đầu tiên chưa biết sheet cao bao nhiêu — onLayout sẽ khởi động thay.
      if (measured.current) ty.value = withSpring(0, SHEET_SPRING);
    } else if (mounted) {
      ty.value = withTiming(sheetH.value, SHEET_OUT, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    sheetH.value = h;
    if (!measured.current) {
      measured.current = true;
      ty.value = h;
      if (visible) ty.value = withSpring(0, SHEET_SPRING);
    } else if (!visible) {
      ty.value = h;
    }
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));
  // Độ mờ của nền bám theo vị trí sheet, nên lúc kéo tay xuống nó nhạt dần theo ngón.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, ty.value / Math.max(1, sheetH.value)),
  }));

  const dragFrom = useSharedValue(0);
  // Màn chi tiết pin re-render theo từng gói SSE, mà sheet là con của nó. `Gesture.Pan()` dựng
  // lại mỗi lần render nghĩa là GestureDetector nạp lại handler native NGAY GIỮA cú kéo — đó là
  // chỗ tay bị khựng. Gesture dựng đúng một lần; `onClose` đi qua ref nên closure không cần mới.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const requestClose = useCallback(() => closeRef.current(), []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-12, 12])
        .onStart(() => {
          dragFrom.value = ty.value;
        })
        .onUpdate((e) => {
          // Kéo lên không đi đâu cả: sheet đã ở đỉnh của nó, cho nó giãn ra là nói dối.
          ty.value = Math.max(0, dragFrom.value + e.translationY);
        })
        .onEnd((e) => {
          // Vẩy nhanh cũng đóng, không bắt phải kéo đủ 30% chiều cao.
          if (ty.value > sheetH.value * 0.3 || e.velocityY > 900) {
            runOnJS(requestClose)();
          } else {
            ty.value = withSpring(0, SHEET_SPRING);
          }
        }),
    [dragFrom, ty, sheetH, requestClose],
  );
  // Một lần bấm = MỘT thông báo, kể cả "Both" (hai lệnh, hai ack, có thể thêm lỗi gửi).
  // Gom kết quả của cả lượt vào đây rồi báo đúng một lần khi lượt kết thúc.
  const batch = useRef<Batch | null>(null);
  const state = stateQuery.data;
  const lastCommand = state?.lastCommand;
  // Lượt được chốt xong từ trong một async closure, nơi `state` của render bắt được đã cũ.
  const stateRef = useRef(state);
  stateRef.current = state;
  const queryError =
    stateQuery.error instanceof HttpError ? stateQuery.error : null;
  // Cascade risk UI hidden on FE — warning banner disabled accordingly.
  const highRisk = false;

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  // Sheet KHÔNG unmount khi đóng (chỉ đổi `visible`), nên query sẽ giữ nguyên dữ liệu fetch
  // lúc vào màn hình. Mở lại phải đọc lại trạng thái MOSFET thật.
  const refetchState = stateQuery.refetch;
  useEffect(() => {
    if (visible) void refetchState();
  }, [visible, refetchState]);

  const finishBatch = () => {
    const current = batch.current;
    if (!current) return;
    batch.current = null;
    setBusy(false);
    if (current.failures.length === 0) {
      // Thành công thì đừng chặn đường bằng dialog phải bấm OK: hai ô trạng thái ngay trên đã
      // hiện kết quả thật rồi, dải này chỉ xác nhận là lệnh đã xong. Lỗi thì vẫn Alert — thứ đó
      // phải được nhìn thấy và bấm xác nhận.
      setFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(false), 2200);
      return;
    }
    // Trùng nhau thì gộp: hai MOSFET hỏng cùng một lý do vẫn chỉ là một câu.
    Alert.alert(
      "Couldn't apply the change",
      [...new Set(current.failures)].join("\n"),
    );
  };

  // Chốt lượt CHỈ khi lệnh cuối đã gửi xong VÀ đã ack xong. `sealed` là thứ chặn ca "Both"
  // báo ngay sau lệnh charge trong lúc lệnh discharge còn chưa được gửi đi.
  const settle = () => {
    const current = batch.current;
    const state = stateRef.current;
    if (!current || !current.sealed) return;

    const finalId = current.issued[current.issued.length - 1];
    if (!finalId) return; // không lệnh nào tới được thiết bị — submit() đã báo rồi
    // `lastCommand` là lệnh MỚI NHẤT ở backend. Chờ tới khi nó chính là lệnh chốt lượt, nếu không
    // ta đang đọc ack của lệnh đầu và kết luận sớm.
    if (state?.lastCommand?.cmdId !== finalId) return;
    if (
      state.lastCommand.status === BmsSwitchCommandStatus.Pending ||
      state.pendingCommand
    )
      return;

    if (FAILED_STATUSES.has(state.lastCommand.status)) {
      current.failures.push(commandFailureMessage(state.lastCommand.status));
    }

    // Rồi mới xét trạng thái ĐỌC VỀ của từng MOSFET: ack của lệnh đầu có thể đã bị lệnh sau ghi
    // đè trong `lastCommand`, nên readback mới là bằng chứng cả hai vế đã đổi thật. `null` là
    // thiết bị không báo trạng thái — không coi là sai, ack ở trên đã nói phần đó.
    for (const target of current.targets) {
      const actual =
        target === BmsSwitchTarget.Charge
          ? state.chargeEnabled
          : state.dischargeEnabled;
      if (actual != null && actual !== current.enable) {
        current.failures.push(
          `${targetLabel(target) === "charge" ? "Charging" : "Power output"} did not turn ${current.enable ? "on" : "off"}.`,
        );
      }
    }

    finishBatch();
  };

  // Chạy theo mỗi lần state đổi; `submit` cũng gọi thẳng sau khi seal, phòng ca ack về ngay
  // trong lần refetch cuối — lúc đó không còn `pendingCommand` để poll 400ms đánh thức nữa.
  useEffect(settle, [state]);

  // "Both" gửi HAI lệnh TUẦN TỰ (charge rồi discharge), không phải một lệnh `target: "all"`.
  // Firmware chỉ map charge=1 / discharge=2 nên `"all"` rớt validation ở thiết bị và ack `failed`;
  // hai lệnh rời chạy được với firmware đang nạp, và backend không chặn vì hai MOSFET khác nhau
  // không tính là xung đột. Mỗi MOSFET cũng có ack + readback riêng, nên hỏng một nửa nhìn ra ngay.
  //
  // Đọc lại status NGAY sau mỗi lần bấm: response accept chỉ có cmdId, không có trạng thái
  // MOSFET. Phải fetch lại thì `pendingCommand` mới vào cache, và chỉ khi đó query mới đổi
  // sang nhịp poll 400ms để bắt readback — không thì nó ngồi im tới lần refetch 30s kế tiếp.
  // cmdId phải vào `awaiting` TRƯỚC khi refetch: thiết bị nhanh có thể ack ngay trong lần fetch
  // đó, và một ack tới lúc lượt chưa ghi nhận lệnh là một ack bị bỏ rơi — không ai báo gì cả.
  const submitOne = async (
    target: BmsSwitchTarget,
    enable: boolean,
  ): Promise<boolean> => {
    const current = batch.current;
    try {
      const accepted = await mutation.mutateAsync({ target, enable });
      if (current) current.issued.push(accepted.cmdId);
      await refetchState();
      return true;
    } catch (error) {
      if (current) {
        current.failures.push(
          error instanceof Error
            ? error.message
            : "Unable to send the command to the device.",
        );
        // Lệnh không rời được máy thì đừng đòi readback của vế đó nữa — lỗi gửi đã nói rồi.
        current.targets = current.targets.filter((t) => t !== target);
      }
      return false;
    }
  };

  const submit = (payload: SetBmsSwitchPayload) => {
    const current: Batch = {
      enable: payload.enable,
      targets:
        payload.target === BmsSwitchTarget.All
          ? [BmsSwitchTarget.Charge, BmsSwitchTarget.Discharge]
          : [payload.target],
      issued: [],
      sealed: false,
      failures: [],
    };
    batch.current = current;
    setBusy(true);

    void (async () => {
      if (payload.target !== BmsSwitchTarget.All) {
        await submitOne(payload.target, payload.enable);
      } else {
        const chargeSent = await submitOne(
          BmsSwitchTarget.Charge,
          payload.enable,
        );
        // TẮT thì vẫn đi tiếp — cô lập được vế nào hay vế đó. BẬT thì dừng, không để pin bật
        // nửa vời trong khi vế kia lỗi.
        if (chargeSent || !payload.enable) {
          // Chờ 1.2s cho bus RS485/Modbus và BMS xử lý xong lệnh đầu rồi mới gửi lệnh thứ hai.
          // Bắn liên tiếp thì lệnh discharge rơi vào lúc bus còn bận và ack về failed.
          await new Promise((resolve) => setTimeout(resolve, 1200));
          await submitOne(BmsSwitchTarget.Discharge, payload.enable);
        } else {
          current.targets = current.targets.filter(
            (t) => t !== BmsSwitchTarget.Discharge,
          );
        }
      }

      // So sánh identity phòng người dùng đã bấm lượt mới trong lúc chờ.
      if (batch.current !== current) return;
      current.sealed = true;
      // Không lệnh nào tới được thiết bị → sẽ chẳng có ack nào để chờ, báo lỗi ngay.
      if (current.issued.length === 0) finishBatch();
      else settle();
    })();
  };

  const confirm = (target: BmsSwitchTarget, enable: boolean) =>
    setConfirmation({ target, enable });

  const pending = busy || state?.pendingCommand != null || mutation.isPending;

  const targetsOf = (t: BmsSwitchTarget) =>
    t === BmsSwitchTarget.All
      ? [BmsSwitchTarget.Charge, BmsSwitchTarget.Discharge]
      : [t];
  const readbackOf = (t: BmsSwitchTarget) =>
    t === BmsSwitchTarget.Charge
      ? state?.chargeEnabled
      : state?.dischargeEnabled;
  // `null` = thiết bị không báo trạng thái → KHÔNG khoá: không chứng minh được là thừa.
  const isRedundant = (enable: boolean) =>
    targetsOf(pickTarget).every((t) => {
      const actual = readbackOf(t);
      return actual != null && actual === enable;
    });
  // Hướng thực sự sẽ gửi đi. Nếu hướng đang chọn hoá ra thừa (đã ở sẵn trạng thái đó) mà hướng
  // kia thì không, tự lật sang hướng kia — dẫn xuất chứ không setState trong effect, nên không
  // tốn thêm một lần render và không có khoảnh khắc thumb nằm trên ô bấm không được.
  const activeEnable =
    isRedundant(pickEnable) && !isRedundant(!pickEnable)
      ? !pickEnable
      : pickEnable;
  const redundant = isRedundant(activeEnable);

  // Chỉ MOSFET đang có lệnh bay mới hiện "Waiting…" — vế kia vẫn phải đọc được trạng thái thật
  // của nó. Hai ô cùng "Waiting…" là nói dối về vế chưa hề bị đụng tới.
  const inFlight = mutation.isPending
    ? mutation.variables?.target
    : state?.pendingCommand?.target;
  const isWaiting = (target: BmsSwitchTarget) =>
    inFlight === target || inFlight === BmsSwitchTarget.All;
  const updatedLabel = formatUpdatedAt(stateQuery.data?.updatedAt);

  // The device does not expose BMS control (404), or the firmware rejected it as
  // unsupported — say so rather than showing switches that cannot work.
  const unavailable =
    queryError?.statusCode === 404 ||
    (lastCommand?.status === BmsSwitchCommandStatus.Rejected &&
      isUnsupportedReason(lastCommand.deviceReason));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        {/* Nền mờ DẦN HIỆN, sheet trượt lên riêng. `animationType="slide"` của RN kéo cả cụm
            modal lên một lượt, nên lớp phủ cũng dâng từ đáy — nhìn như nền phía trên bị đẩy. */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Close"
          />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[styles.sheet, sheetStyle]}
            onLayout={onSheetLayout}
          >
            <View style={styles.grabber} />

            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="flash" size={20} color={Solar.yellowDeep} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Battery control</Text>
                <Text style={styles.subtitle}>
                  Turn charging and power output on or off
                </Text>
              </View>
              <Pressable
                style={styles.closeBtn}
                onPress={onClose}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={Colors.textMute} />
              </Pressable>
            </View>

            {flash ? (
              <Animated.View
                entering={FadeInDown.duration(180)}
                exiting={FadeOut.duration(220)}
                style={styles.successBanner}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Colors.successDark}
                />
                <Text style={styles.successText}>Success</Text>
              </Animated.View>
            ) : null}

            {highRisk && !unavailable ? (
              <View style={styles.riskBanner}>
                <Ionicons name="warning" size={16} color={Colors.dangerDark} />
                <Text style={styles.riskBannerText}>
                  This battery has a high cascade risk. Have the site checked
                  before switching it back on.
                </Text>
              </View>
            ) : null}

            {stateQuery.isLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={Solar.yellowDeep} />
              </View>
            ) : unavailable ? (
              <Text style={styles.error}>
                This battery does not support remote control.
              </Text>
            ) : queryError ? (
              <Text style={styles.error}>{queryError.message}</Text>
            ) : (
              <>
                {/* Trạng thái hiện tại đứng trước — đó là thứ người vận hành xem trước khi quyết
                  định. Nó là hiển thị CHỈ-ĐỌC, không phải cái công tắc: mô hình toggle cũ giấu
                  hướng thao tác vào trạng thái hiện tại, nên phải đọc nhãn phụ mới biết chạm vào
                  sẽ ra gì. Icon là hướng dòng điện (vào pack / ra tải) chứ không phải hai biểu
                  tượng power giống hệt nhau. */}
                <View style={styles.stateRow}>
                  <StateTile
                    label="Charge"
                    icon="arrow-down"
                    value={state?.chargeEnabled}
                    pending={isWaiting(BmsSwitchTarget.Charge)}
                  />
                  <StateTile
                    label="Discharge"
                    icon="arrow-up"
                    value={state?.dischargeEnabled}
                    pending={isWaiting(BmsSwitchTarget.Discharge)}
                  />
                </View>
                <Text style={styles.updatedLine}>{updatedLabel}</Text>

                {/* Chọn MOSFET → chọn hướng → xác nhận. Cùng thứ tự với dialog trên web: hai màn
                  điều khiển cùng một phần cứng thì không được bắt người dùng nhớ hai lối nghĩ. */}
                <Segment
                  value={pickTarget}
                  disabled={pending}
                  onChange={setPickTarget}
                  options={[
                    { value: BmsSwitchTarget.All, label: "Both" },
                    { value: BmsSwitchTarget.Charge, label: "Charge" },
                    { value: BmsSwitchTarget.Discharge, label: "Discharge" },
                  ]}
                />

                <Segment
                  value={activeEnable}
                  disabled={pending}
                  onChange={setPickEnable}
                  options={[
                    {
                      value: false,
                      label: "Turn off",
                      icon: "power",
                      tint: Colors.danger,
                      disabled: isRedundant(false),
                    },
                    {
                      value: true,
                      label: "Turn on",
                      icon: "power",
                      tint: Colors.successDark,
                      disabled: isRedundant(true),
                    },
                  ]}
                />

                <Pressable
                  style={[
                    styles.applyBtn,
                    activeEnable ? styles.applyBtnOn : styles.applyBtnOff,
                    (pending || redundant) && styles.applyBtnDisabled,
                  ]}
                  disabled={pending || redundant}
                  accessibilityRole="button"
                  onPress={() => confirm(pickTarget, activeEnable)}
                >
                  {/* Trạng thái gửi nằm NGAY trên nút vừa bấm, không phải một dòng chữ rời bên
                    dưới — mắt đang ở nút thì phản hồi phải ở đó. */}
                  {pending ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Ionicons name="power" size={16} color={Colors.white} />
                  )}
                  <Text style={styles.applyBtnText}>
                    {activeEnable ? "Turn on" : "Turn off"}{" "}
                    {targetLabel(pickTarget)}
                  </Text>
                </Pressable>
              </>
            )}

            <ConfirmDialog
              confirmation={confirmation}
              highRisk={highRisk}
              submitting={mutation.isPending}
              onCancel={() => setConfirmation(null)}
              onConfirm={(payload) => {
                setConfirmation(null);
                submit(payload);
              }}
            />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

function ConfirmDialog({
  confirmation,
  highRisk,
  submitting,
  onCancel,
  onConfirm,
}: {
  confirmation: SetBmsSwitchPayload | null;
  highRisk: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (payload: SetBmsSwitchPayload) => void;
}) {
  if (!confirmation) return null;

  const { target, enable } = confirmation;
  const tone = enable ? Colors.successDark : Colors.danger;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Biểu tượng mang màu của hành động — đỏ là cắt điện, xanh là nối lại. Người dùng
              nhìn thấy mình sắp làm gì trước cả khi đọc chữ. */}
          <View
            style={[
              styles.modalMedia,
              {
                backgroundColor: enable
                  ? Colors.successLight
                  : Colors.dangerLight,
              },
            ]}
          >
            <Ionicons name="power" size={24} color={tone} />
          </View>

          <Text style={styles.modalTitle}>
            {enable ? "Turn on" : "Turn off"} {targetLabel(target)}?
          </Text>
          <Text style={styles.modalConsequence}>
            {consequenceText(target, enable)}
          </Text>

          {highRisk ? (
            <View style={styles.riskWarningBox}>
              <Ionicons name="warning" size={16} color={Colors.dangerDark} />
              <Text style={styles.riskWarningText}>
                High cascade risk — inspect the site first.
              </Text>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, styles.cancelButton]}
              disabled={submitting}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: tone }]}
              disabled={submitting}
              onPress={() => onConfirm(confirmation)}
            >
              <Text style={styles.confirmButtonText}>
                {enable ? "Turn on" : "Turn off"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StateTile({
  label,
  icon,
  value,
  pending,
}: {
  label: string;
  icon: "arrow-down" | "arrow-up";
  value: boolean | null | undefined;
  pending: boolean;
}) {
  const unknown = value == null;
  const tone =
    pending || unknown
      ? Colors.textMute
      : value
        ? Colors.successDark
        : Colors.danger;

  return (
    <View style={styles.stateTile}>
      <Text style={styles.stateTileLabel}>{label}</Text>
      <View style={styles.stateTileValueRow}>
        <Ionicons name={icon} size={14} color={tone} />
        <Text style={[styles.stateTileValue, { color: tone }]}>
          {stateLabel(value, pending)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 34,
    gap: 4,
  },
  grabber: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.graySoft,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Solar.yellowSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.accent,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: "600",
    color: Colors.textMute,
    marginTop: 2,
    lineHeight: 17,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.graySoft,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.successLight,
    paddingVertical: 9,
    marginBottom: 4,
  },
  successText: { fontSize: 13, fontWeight: "800", color: Colors.successDark },
  riskBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerLight,
    padding: 10,
    marginBottom: 4,
  },
  riskBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.dangerDark,
    lineHeight: 17,
  },
  centered: { paddingVertical: 28, alignItems: "center" },
  stateRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  stateTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stateTileLabel: { fontSize: 10.5, fontWeight: "700", color: Colors.textMute },
  stateTileValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  stateTileValue: { fontSize: 14, fontWeight: "800" },
  updatedLine: {
    fontSize: 10.5,
    color: Colors.textMute,
    marginTop: 6,
    marginBottom: 2,
  },
  segment: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: Colors.graySoft,
    borderRadius: Radius.md,
    padding: 4,
    marginTop: 8,
  },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
  },
  segmentThumb: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    shadowColor: Solar.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: { fontSize: 12.5, fontWeight: "700", color: Colors.textMute },
  segmentTextOn: { color: Colors.accent, fontWeight: "800" },
  segmentTextOff: { opacity: 0.5 },
  applyBtn: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.md,
    marginTop: 12,
  },
  applyBtnOn: { backgroundColor: Colors.successDark },
  applyBtnOff: { backgroundColor: Colors.danger },
  applyBtnDisabled: { opacity: 0.5 },
  applyBtnText: { color: Colors.white, fontSize: 14, fontWeight: "800" },
  error: {
    paddingVertical: 16,
    color: Colors.dangerDark,
    fontSize: 13,
    lineHeight: 19,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: Colors.overlay,
  },
  modalCard: {
    borderRadius: Radius.lg,
    padding: 20,
    gap: 10,
    backgroundColor: Colors.white,
    alignItems: "center",
  },
  modalMedia: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.accent,
    textAlign: "center",
  },
  riskWarningBox: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.dangerLight,
  },
  riskWarningText: {
    flex: 1,
    color: Colors.dangerDark,
    fontSize: 12,
    fontWeight: "700",
  },
  modalConsequence: {
    color: Colors.textMute,
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 19,
    textAlign: "center",
  },
  modalActions: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modalButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
  cancelButton: { backgroundColor: Colors.card3 },
  cancelButtonText: { color: Colors.text2, fontSize: 14, fontWeight: "700" },
  confirmButtonText: { color: Colors.white, fontSize: 14, fontWeight: "800" },
});
