import React, { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Line } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Colors, Font, Radius, Solar } from "@/src/lib/theme";
import { formatTimeSeconds } from "@/src/lib/date";
import { ChargingStateEnum } from "../enums/battery.enum";
import { LiveReadingDto } from "../types/live-reading.types";
import { GlassSurface } from "./EnergyBackdrop";

// One row: [charge in] ── (pack) ── [discharge out]. GAP is the channel each rail runs
// through — widening it steals width from the tiles, and the value has to fit.
const HUB_W = 78;
const HUB_H = 66;
const GAP = 34;
const ROW_H = 100;
const MID_Y = ROW_H / 2;
const INSET = 6; // khoảng thở giữa đầu ray và mép ô/hub
const COMET = 16;

type Flow = "in" | "out" | "idle";

/** SSE omits `chargingState` on most sources, so the current sign is the fallback. */
export function flowOf(live?: LiveReadingDto | null): Flow {
  if (!live) return "idle";
  if (live.chargingState === ChargingStateEnum.Charging) return "in";
  if (live.chargingState === ChargingStateEnum.Discharging) return "out";
  if (live.chargingState === ChargingStateEnum.Idle) return "idle";
  if (live.current > 0.05) return "in";
  if (live.current < -0.05) return "out";
  return "idle";
}

export const FLOW_META: Record<
  Flow,
  {
    label: string;
    color: string;
    bg: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  in: {
    label: "Charging",
    color: Colors.successDark,
    bg: Colors.successLight,
    icon: "arrow-down-circle",
  },
  out: {
    label: "Discharging",
    color: Colors.infoDark,
    bg: Colors.infoLight,
    icon: "arrow-up-circle",
  },
  idle: {
    label: "Idle",
    color: Solar.mute,
    bg: Solar.tile,
    icon: "pause-circle",
  },
};

function clockOf(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return formatTimeSeconds(d);
}

type TileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  label: string;
  amps: number | null;
  watts: number | null;
  width: number;
  active: boolean;
  align: "left" | "right";
};

function Tile({
  icon,
  tint,
  bg,
  label,
  amps,
  watts,
  width,
  active,
  align,
}: TileProps) {
  const right = align === "right";
  return (
    <View
      style={[
        styles.tile,
        { width, backgroundColor: bg },
        !active && styles.tileIdle,
      ]}
    >
      <View style={[styles.tileHead, right && styles.headRight]}>
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      <Text
        style={[styles.tileLabel, right && styles.textRight]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View style={[styles.tileValueRow, right && styles.rowEnd]}>
        <Text style={styles.tileValue} numberOfLines={1}>
          {amps == null ? "—" : amps.toFixed(2)}
        </Text>
        <Text style={styles.tileUnit}>A</Text>
      </View>
      <Text
        style={[styles.tileWatts, right && styles.textRight]}
        numberOfLines={1}
      >
        {watts == null ? "—" : `${watts.toFixed(1)} W`}
      </Text>
    </View>
  );
}

/**
 * Home telemetry card: the two directions power can move, wired to the pack.
 * Only the live direction carries the travelling spark — that spark IS the charge
 * direction, not decoration. Terminal voltage sits in the hub because it belongs to
 * the pack itself, not to either flow.
 */
export function EnergyFlowCard({
  live,
  serial,
}: {
  live?: LiveReadingDto | null;
  serial?: string;
}) {
  const [width, setWidth] = useState(0);
  const flow = flowOf(live);

  const tileW = width > 0 ? (width - HUB_W - GAP * 2) / 2 : 0;
  const rails = useMemo(() => {
    const hubLeft = tileW + GAP;
    const hubRight = hubLeft + HUB_W;
    return {
      left: { from: tileW + INSET, to: hubLeft - INSET },
      right: { from: hubRight + INSET, to: width - tileW - INSET },
    };
  }, [tileW, width]);

  // Một hạt chạy dọc ray đọc gọn hơn nhiều so với gạch đứt: đoạn nối chỉ dài ~30dp, dash
  // pattern trên đó vỡ thành mấy mẩu rời trông như lỗi render.
  const travel = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(travel);
    travel.value = 0;
    if (flow === "idle") return;
    travel.value = withRepeat(
      withTiming(1, { duration: 1150, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(travel);
  }, [flow, travel]);

  const rail = flow === "out" ? rails.right : rails.left;
  const cometStyle = useAnimatedStyle(() => {
    const p = travel.value;
    return {
      // Sáng dần ở giữa, tắt ở hai đầu — hạt không "bụp" ra rồi biến mất ở mép ray.
      opacity: flow === "idle" ? 0 : Math.sin(Math.PI * p),
      transform: [
        { translateX: rail.from + (rail.to - rail.from) * p - COMET / 2 },
      ],
    };
  });

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.35 }],
    opacity: (1 - pulse.value) * 0.28,
  }));

  const clock = clockOf(live?.time);
  const chargeAmps = live ? Math.max(live.current, 0) : null;
  const dischargeAmps = live ? Math.max(-live.current, 0) : null;
  const watts = (amps: number | null) =>
    amps == null || !live ? null : amps * live.voltage;

  return (
    <GlassSurface style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="pulse" size={26} color={Solar.yellowDeep} />
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {serial ?? "Live telemetry"}
          </Text>
          <Text style={styles.headerMeta} numberOfLines={1}>
            {clock ? `Last reading ${clock}` : "Waiting for a reading…"}
          </Text>
        </View>
      </View>

      <View
        style={styles.grid}
        onLayout={(e: LayoutChangeEvent) =>
          setWidth(e.nativeEvent.layout.width)
        }
      >
        {width > 0 ? (
          <>
            {/* Ray nền luôn có ở cả hai phía — mạch không tự biến mất khi ngừng chảy; vế đang
                sống chỉ đậm hơn. Hai bên cùng một hình dạng thì mắt không thấy lệch. */}
            <Svg width={width} height={ROW_H} style={StyleSheet.absoluteFill}>
              {[
                [rails.left, flow === "in"] as const,
                [rails.right, flow === "out"] as const,
              ].map(([r, isActive]) => (
                <Line
                  key={r.from}
                  x1={r.from}
                  y1={MID_Y}
                  x2={r.to}
                  y2={MID_Y}
                  stroke={isActive ? Solar.ink : Solar.faint}
                  strokeWidth={isActive ? 2 : 1.5}
                  strokeLinecap="round"
                  opacity={isActive ? 0.85 : 0.5}
                />
              ))}
            </Svg>

            <Animated.View
              style={[styles.comet, cometStyle]}
              pointerEvents="none"
            >
              <View style={styles.cometGlow} />
              <View style={styles.cometCore} />
            </Animated.View>

            <View style={styles.row}>
              <Tile
                width={tileW}
                align="left"
                active={flow === "in"}
                icon="arrow-down"
                tint={Colors.successDark}
                bg={Colors.successLight}
                label="Charge in"
                amps={chargeAmps}
                watts={watts(chargeAmps)}
              />
              <Tile
                width={tileW}
                align="right"
                active={flow === "out"}
                icon="arrow-up"
                tint={Colors.infoDark}
                bg={Colors.infoLight}
                label="Discharge out"
                amps={dischargeAmps}
                watts={watts(dischargeAmps)}
              />
            </View>

            <View
              style={[
                styles.hubWrap,
                { left: (width - HUB_W) / 2, top: MID_Y - HUB_H / 2 },
              ]}
              pointerEvents="none"
            >
              <Animated.View style={[styles.hubRing, ringStyle]} />
              <View style={styles.hub}>
                <Ionicons name="flash" size={15} color={Solar.yellowDeep} />
                <Text style={styles.hubValue} numberOfLines={1}>
                  {live ? live.voltage.toFixed(2) : "—"}
                  <Text style={styles.hubUnit}> V</Text>
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  headerCopy: { flex: 1 },
  headerTitle: { ...Font.body, fontSize: 15 },
  headerMeta: { ...Font.meta, fontSize: 11, marginTop: 1 },

  grid: { height: ROW_H },
  row: { flexDirection: "row", justifyContent: "space-between" },
  tile: {
    height: ROW_H,
    borderRadius: Radius.tile,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  tileIdle: { opacity: 0.5 },
  tileHead: { flexDirection: "row", height: 22, alignItems: "center" },
  headRight: { justifyContent: "flex-end" },
  tileLabel: { ...Font.meta, fontSize: 10, marginTop: 7 },
  textRight: { textAlign: "right" },
  tileValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
    marginTop: 1,
  },
  rowEnd: { justifyContent: "flex-end" },
  tileValue: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "700",
    color: Solar.ink,
    letterSpacing: -0.7,
  },
  tileUnit: { fontSize: 11, fontWeight: "700", color: Solar.mute },
  tileWatts: { ...Font.meta, fontSize: 10, color: Solar.ink2, marginTop: 1 },

  comet: {
    position: "absolute",
    left: 0,
    top: MID_Y - COMET / 2,
    width: COMET,
    height: COMET,
    alignItems: "center",
    justifyContent: "center",
  },
  cometGlow: {
    position: "absolute",
    width: COMET,
    height: COMET,
    borderRadius: COMET / 2,
    backgroundColor: Solar.yellow,
    opacity: 0.3,
  },
  cometCore: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Solar.yellow,
    borderWidth: 1,
    borderColor: Solar.yellowDeep,
  },

  hubWrap: {
    position: "absolute",
    width: HUB_W,
    height: HUB_H,
    alignItems: "center",
    justifyContent: "center",
  },
  hubRing: {
    position: "absolute",
    width: HUB_W,
    height: HUB_H,
    borderRadius: 24,
    backgroundColor: Solar.yellow,
  },
  hub: {
    width: HUB_W,
    height: HUB_H,
    borderRadius: 24,
    backgroundColor: Solar.white,
    borderWidth: 1.5,
    borderColor: Solar.yellow,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  hubValue: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "700",
    color: Solar.ink,
    letterSpacing: -0.4,
  },
  hubUnit: { fontSize: 10, fontWeight: "700", color: Solar.mute },
});
