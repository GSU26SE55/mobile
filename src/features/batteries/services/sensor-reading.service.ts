import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  SensorReadingDto,
  SensorReadingHistoryParams,
  SensorReadingHistoryResponseDto,
  SensorReadingAggregateParams,
  SensorReadingAggregateHourlyParams,
  SensorReadingAggregateDto,
} from '../types/sensor-reading.types';

export const sensorReadingService = {
  getLatest: (assetId: string) =>
    axiosInstance.get<CommonResponse<SensorReadingDto>>(
      ENDPOINTS.SENSOR_READINGS.LATEST(assetId),
    ),
  getHistory: (assetId: string, params?: SensorReadingHistoryParams) =>
    axiosInstance.get<CommonResponse<SensorReadingHistoryResponseDto>>(
      ENDPOINTS.SENSOR_READINGS.HISTORY(assetId),
      { params },
    ),
  getAggregate: (assetId: string, params?: SensorReadingAggregateParams) =>
    axiosInstance.get<CommonResponse<SensorReadingAggregateDto[]>>(
      ENDPOINTS.SENSOR_READINGS.AGGREGATE(assetId),
      { params },
    ),
  // GH-74 — bucket 1h cố định (continuous aggregate). KHÔNG nhận `interval`.
  getAggregateHourly: (assetId: string, params?: SensorReadingAggregateHourlyParams) =>
    axiosInstance.get<CommonResponse<SensorReadingAggregateDto[]>>(
      ENDPOINTS.SENSOR_READINGS.AGGREGATE_HOURLY(assetId),
      { params },
    ),
};
