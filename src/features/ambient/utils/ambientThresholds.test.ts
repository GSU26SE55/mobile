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
    comboTempThreshold: 32,
    comboHumidityThreshold: 65,
    ...over,
  }) as AmbientThresholdConfigDto;

const reading = (ambientTemperature: number | null, humidity: number | null) =>
  ({ ambientTemperature, humidity }) as never;

describe("xếp hạng từng chỉ số", () => {
  it.each([
    [30, "ok"],
    [35, "warning"],
    [40, "warning"],
    [45, "critical"],
    [50, "critical"],
  ])("nhiệt độ %s°C → %s", (temp, expected) => {
    expect(evaluateAmbientRow(reading(temp, 10), config()).temperature).toBe(expected);
  });

  it.each([
    [50, "ok"],
    [70, "warning"],
    [85, "critical"],
  ])("độ ẩm %s%% → %s", (hum, expected) => {
    expect(evaluateAmbientRow(reading(10, hum), config()).humidity).toBe(expected);
  });

  // Đúng bằng ngưỡng là đã vượt — backend cảnh báo ở mốc này, màn hình phải khớp.
  it("giá trị đúng bằng ngưỡng đã tính là vượt", () => {
    const r = evaluateAmbientRow(reading(45, 85), config());
    expect(r.temperature).toBe("critical");
    expect(r.humidity).toBe("critical");
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
  it.each([
    ["không có cấu hình", null],
    ["cấu hình tắt", config({ enabled: false })],
  ])("%s thì mọi thứ đều trung tính", (_label, threshold) => {
    const r = evaluateAmbientRow(reading(99, 99), threshold as never);
    expect(r).toEqual({
      temperature: null,
      humidity: null,
      combo: false,
      worst: null,
    });
  });
});

describe("ngưỡng kết hợp nóng ẩm", () => {
  // Nóng cộng ẩm nguy hiểm hơn từng thứ riêng lẻ, nên có cặp ngưỡng thấp hơn chỉ nổ khi
  // cả hai cùng vượt. Dòng dưới đây từng chỉ hiện "ok" vì mỗi chỉ số đều dưới mức riêng.
  it("cả hai cùng vượt cặp ngưỡng thấp thì báo kết hợp", () => {
    const r = evaluateAmbientRow(reading(33, 68), config());
    expect(r.temperature).toBe("ok");
    expect(r.humidity).toBe("ok");
    expect(r.combo).toBe(true);
    expect(r.worst).toBe("warning");
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
