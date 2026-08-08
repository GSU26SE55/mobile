// Ambient enums — mirror docs/api-battery.md §AmbientReadingSourceEnum. BE returns int.
export const AmbientReadingSourceEnum = {
  IotSensor: 1,  // actual IoT sensor at the site
  WeatherApi: 2, // synced from OpenMeteo (default)
} as const;
export type AmbientReadingSourceEnum =
  (typeof AmbientReadingSourceEnum)[keyof typeof AmbientReadingSourceEnum];
