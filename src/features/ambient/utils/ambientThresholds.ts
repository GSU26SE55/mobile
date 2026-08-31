import type { AmbientReadingDto, AmbientThresholdConfigDto } from '../types/ambient.types';

/**
 * Grading ambient readings against the site's configured limits — port of web's
 * `shared/lib/ambientThresholds.ts`. The two must agree: the same incident is read
 * on a phone in the field and on a desktop by the Manager, and a row that is red on
 * one screen must be red on the other.
 *
 * Same rule as the battery evidence panel: a blank threshold means "not monitored",
 * so it grades to `null` rather than falling back to a made-up limit. Colouring a row
 * against a number nobody configured — and the backend never alerted on — is worse
 * than leaving it uncoloured.
 */

export type AmbientLevel = 'critical' | 'warning' | 'ok' | null;

function grade(
  value: number | null | undefined,
  warning: number | null | undefined,
  critical: number | null | undefined,
): AmbientLevel {
  if (value === null || value === undefined) return null;
  // Strict `>`, matching BE's `AnomalyRules.DetectAmbient` — `>=` would colour a value
  // exactly at the limit even though the backend never raised an alert for it.
  if (critical !== null && critical !== undefined && value > critical) return 'critical';
  if (warning !== null && warning !== undefined && value > warning) return 'warning';
  const monitored =
    (warning !== null && warning !== undefined) || (critical !== null && critical !== undefined);
  return monitored ? 'ok' : null;
}

export interface AmbientRowEvaluation {
  temperature: AmbientLevel;
  humidity: AmbientLevel;
  gas: AmbientLevel;
  /** Wet → "critical" (always alerts, no configurable threshold). Dry → "ok". Not reported → null. */
  water: AmbientLevel;
  /**
   * Heat plus moisture is worse than either alone, so the site config carries a separate
   * lower pair that only fires when BOTH are exceeded together. It can flag a row whose
   * temperature and humidity are each individually under their own warning line.
   */
  combo: boolean;
  /** Worst level on the row — drives the row highlight. */
  worst: AmbientLevel;
}

export function evaluateAmbientRow(
  reading: Pick<
    AmbientReadingDto,
    'ambientTemperature' | 'humidity' | 'gasConcentration' | 'waterLeakDetected'
  >,
  threshold: AmbientThresholdConfigDto | null | undefined,
): AmbientRowEvaluation {
  // Water has no configurable threshold (3 sensors are independent) — wet always alerts,
  // regardless of whether temp/humidity/gas monitoring is enabled for the site.
  const water: AmbientLevel =
    reading.waterLeakDetected === null || reading.waterLeakDetected === undefined
      ? null
      : reading.waterLeakDetected
        ? 'critical'
        : 'ok';

  const none: AmbientRowEvaluation = {
    temperature: null,
    humidity: null,
    gas: null,
    water,
    combo: false,
    worst: water === 'critical' ? 'critical' : null,
  };
  // `enabled: false` means the site opted out — grading anyway would show breaches
  // for limits that are not in force.
  if (!threshold || !threshold.enabled) return none;

  const temperature = grade(
    reading.ambientTemperature,
    threshold.highAmbientTempWarning,
    threshold.highAmbientTempCritical,
  );
  const humidity = grade(
    reading.humidity,
    threshold.highHumidityWarning,
    threshold.highHumidityCritical,
  );
  const gas = grade(
    reading.gasConcentration,
    threshold.highGasWarning,
    threshold.highGasCritical,
  );

  const combo =
    threshold.comboTempThreshold != null &&
    threshold.comboHumidityThreshold != null &&
    reading.ambientTemperature != null &&
    reading.humidity != null &&
    reading.ambientTemperature >= threshold.comboTempThreshold &&
    reading.humidity >= threshold.comboHumidityThreshold;

  const levels = [temperature, humidity, gas, water];
  // Combo is critical, not warning — matches BE's `HighTempHumidityCombo` alert severity.
  const worst: AmbientLevel = levels.includes('critical') || combo
    ? 'critical'
    : levels.includes('warning')
      ? 'warning'
      : levels.includes('ok')
        ? 'ok'
        : null;

  return { temperature, humidity, gas, water, combo, worst };
}
