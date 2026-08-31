import { describe, expect, it } from "vitest";
import { evaluateAmbientRow } from "@/src/features/ambient/utils/ambientThresholds";
import type { AmbientThresholdConfigDto } from "@/src/features/ambient/types/ambient.types";

const config = (over: Partial<AmbientThresholdConfigDto> = {}) =>
  ({
    enabled: true,
    highAmbientTempWarning: 35,
    highAmbientTempCritical: 45,
    highHumidityWarning: 70,
    highHumidityCritical: 85,
    highGasWarning: 1000,
    highGasCritical: 2000,
    comboTempThreshold: 32,
    comboHumidityThreshold: 65,
    ...over,
  }) as AmbientThresholdConfigDto;

const reading = (
  ambientTemperature: number | null,
  humidity: number | null,
  gasConcentration: number | null = null,
  waterLeakDetected: boolean | null = null,
) => ({ ambientTemperature, humidity, gasConcentration, waterLeakDetected }) as never;

describe("xếp hạng từng chỉ số", () => {
  it.each([
    [30, "ok"],
    [35, "ok"],
    [40, "warning"],
    [45, "warning"],
    [46, "critical"],
  ])("nhiệt độ %s°C → %s", (temp, expected) => {
    expect(evaluateAmbientRow(reading(temp, 10), config()).temperature).toBe(expected);
  });

  it.each([
    [50, "ok"],
    [70, "ok"],
    [71, "warning"],
    [85, "warning"],
    [86, "critical"],
  ])("độ ẩm %s%% → %s", (hum, expected) => {
    expect(evaluateAmbientRow(reading(10, hum), config()).humidity).toBe(expected);
  });

  it.each([
    [500, "ok"],
    [1500, "warning"],
    [2500, "critical"],
  ])("gas %s ppm → %s", (gas, expected) => {
    expect(evaluateAmbientRow(reading(10, 10, gas), config()).gas).toBe(expected);
  });

  // Đúng bằng ngưỡng thì chưa vượt — khớp BE `AnomalyRules.DetectAmbient` (so sánh strict `>`).
  it("giá trị đúng bằng ngưỡng thì chưa tính là vượt", () => {
    const r = evaluateAmbientRow(reading(45, 85), config());
    expect(r.temperature).toBe("warning");
    expect(r.humidity).toBe("warning");
  });

  it("nước rò rỉ luôn là critical, không rò là ok", () => {
    expect(evaluateAmbientRow(reading(10, 10, null, true), config()).water).toBe("critical");
    expect(evaluateAmbientRow(reading(10, 10, null, false), config()).water).toBe("ok");
    expect(evaluateAmbientRow(reading(10, 10, null, null), config()).water).toBeNull();
  });
});

describe("ngưỡng để trống nghĩa là không theo dõi", () => {
  // Tô màu theo một con số không ai cấu hình, và backend chưa từng cảnh báo, tệ hơn là
  // để trống — người ở hiện trường sẽ tin vào một mức nguy hiểm bịa ra.
  it("không có ngưỡng nhiệt độ thì không xếp hạng nhiệt độ", () => {
    const r = evaluateAmbientRow(
      reading(60, 50),
      config({ highAmbientTempWarning: null, highAmbientTempCritical: null }),
    );
    expect(r.temperature).toBeNull();
  });

  it("có mỗi ngưỡng nguy hiểm vẫn xếp hạng được", () => {
    const r = evaluateAmbientRow(reading(30, 10), config({ highAmbientTempWarning: null }));
    expect(r.temperature).toBe("ok");
  });

  it("thiếu số đo thì không xếp hạng", () => {
    const r = evaluateAmbientRow(reading(null, null), config());
    expect(r.temperature).toBeNull();
    expect(r.humidity).toBeNull();
  });
});

describe("cấu hình bị tắt", () => {
  it("không có cấu hình thì mọi thứ trung tính trừ nước rò rỉ", () => {
    const r = evaluateAmbientRow(reading(99, 99, 99, null), null as never);
    expect(r).toEqual({
      temperature: null,
      humidity: null,
      gas: null,
      water: null,
      combo: false,
      worst: null,
    });
  });

  it("cấu hình tắt thì mọi thứ trung tính trừ nước rò rỉ", () => {
    const r = evaluateAmbientRow(reading(99, 99, 99, null), config({ enabled: false }));
    expect(r).toEqual({
      temperature: null,
      humidity: null,
      gas: null,
      water: null,
      combo: false,
      worst: null,
    });
  });

  it("nước rò rỉ vẫn báo critical dù cấu hình tắt", () => {
    const r = evaluateAmbientRow(reading(10, 10, null, true), config({ enabled: false }));
    expect(r.water).toBe("critical");
    expect(r.worst).toBe("critical");
  });
});

describe("ngưỡng kết hợp nóng ẩm", () => {
  // Nóng cộng ẩm nguy hiểm hơn từng thứ riêng lẻ, nên có cặp ngưỡng thấp hơn chỉ nổ khi
  // cả hai cùng vượt. Dòng dưới đây từng chỉ hiện "ok" vì mỗi chỉ số đều dưới mức riêng.
  it("cả hai cùng vượt cặp ngưỡng thấp thì báo kết hợp (critical)", () => {
    const r = evaluateAmbientRow(reading(33, 68), config());
    expect(r.temperature).toBe("ok");
    expect(r.humidity).toBe("ok");
    expect(r.combo).toBe(true);
    expect(r.worst).toBe("critical");
  });

  it("chỉ một chỉ số vượt thì không phải kết hợp", () => {
    expect(evaluateAmbientRow(reading(33, 60), config()).combo).toBe(false);
    expect(evaluateAmbientRow(reading(30, 68), config()).combo).toBe(false);
  });

  it("thiếu cặp ngưỡng kết hợp thì không bao giờ báo", () => {
    const r = evaluateAmbientRow(
      reading(40, 80),
      config({ comboTempThreshold: null, comboHumidityThreshold: null }),
    );
    expect(r.combo).toBe(false);
  });
});

describe("mức nặng nhất của cả dòng", () => {
  it("một chỉ số nguy hiểm thì cả dòng nguy hiểm", () => {
    expect(evaluateAmbientRow(reading(50, 10), config()).worst).toBe("critical");
  });

  it("nguy hiểm thắng cảnh báo", () => {
    expect(evaluateAmbientRow(reading(50, 72), config()).worst).toBe("critical");
  });

  it("mọi chỉ số trong ngưỡng thì cả dòng bình thường", () => {
    expect(evaluateAmbientRow(reading(20, 40), config()).worst).toBe("ok");
  });
});
