// Ambient enums — mirror docs/api-battery.md §AmbientReadingSourceEnum. BE trả int.
export const AmbientReadingSourceEnum = {
  IotSensor: 1,  // cảm biến IoT thật tại site
  WeatherApi: 2, // sync từ OpenMeteo (mặc định)
} as const;
export type AmbientReadingSourceEnum =
  (typeof AmbientReadingSourceEnum)[keyof typeof AmbientReadingSourceEnum];
