import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Apple Health.
 *
 * HealthKit is native code that only exists in a development build on iOS —
 * Expo Go and the web build have no module to load. Everything here is
 * written so those cases report "unavailable" instead of throwing, and the
 * import is lazy so the bundle still works where the module is missing.
 */

type HealthKitModule = typeof import('@kingstinct/react-native-healthkit');

let cached: HealthKitModule | null | undefined;

function healthkit(): HealthKitModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS !== 'ios') return (cached = null);
  try {
    cached = require('@kingstinct/react-native-healthkit') as HealthKitModule;
  } catch {
    cached = null; // Expo Go: the native side was never built in
  }
  return cached;
}

/** Everything we ask permission to read. */
const READ_TYPES = [
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBasalEnergyBurned',
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierAppleExerciseTime',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierHeight',
] as const;

export type HealthSummary = {
  /** Calories your body burned moving, on top of just existing. */
  activeEnergyKcal: number | null;
  /** Active plus resting, i.e. what the Health app calls total. */
  totalEnergyKcal: number | null;
  steps: number | null;
  exerciseMinutes: number | null;
  restingHeartRate: number | null;
  /** Latest reading, whenever it was taken — not limited to today. */
  weightKg: number | null;
  heightCm: number | null;
};

const EMPTY_SUMMARY: HealthSummary = {
  activeEnergyKcal: null,
  totalEnergyKcal: null,
  steps: null,
  exerciseMinutes: null,
  restingHeartRate: null,
  weightKg: null,
  heightCm: null,
};

/** True when this build can talk to Apple Health at all. */
export function isHealthAvailable(): boolean {
  const hk = healthkit();
  if (!hk) return false;
  try {
    return hk.isHealthDataAvailable();
  } catch {
    return false;
  }
}

/**
 * Asks for read access. iOS only shows the sheet once per type; afterwards it
 * resolves immediately, and a refusal is indistinguishable from "no data" by
 * design, so callers should never treat an empty reading as an error.
 */
export async function requestHealthAccess(): Promise<boolean> {
  const hk = healthkit();
  if (!hk) return false;
  try {
    return await hk.requestAuthorization({ toRead: READ_TYPES });
  } catch {
    return false;
  }
}

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** Reads the summary for a day (defaults to today). Missing values stay null. */
export async function getHealthSummary(day: Date = new Date()): Promise<HealthSummary> {
  const hk = healthkit();
  if (!hk) return EMPTY_SUMMARY;

  const startDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  const filter = { date: { startDate, endDate } };

  /** A failed or unauthorised read is a missing number, not a crash. */
  const total = async (identifier: (typeof READ_TYPES)[number], unit: string): Promise<number | null> => {
    try {
      const stats = await hk.queryStatisticsForQuantity(identifier as never, ['cumulativeSum'], {
        filter,
        unit: unit as never,
      });
      return stats.sumQuantity?.quantity ?? null;
    } catch {
      return null;
    }
  };

  const average = async (identifier: (typeof READ_TYPES)[number], unit: string): Promise<number | null> => {
    try {
      const stats = await hk.queryStatisticsForQuantity(identifier as never, ['discreteAverage'], {
        filter,
        unit: unit as never,
      });
      return stats.averageQuantity?.quantity ?? null;
    } catch {
      return null;
    }
  };

  const latest = async (identifier: (typeof READ_TYPES)[number], unit: string): Promise<number | null> => {
    try {
      const sample = await hk.getMostRecentQuantitySample(identifier as never, unit as never);
      return sample?.quantity ?? null;
    } catch {
      return null;
    }
  };

  const [activeEnergyKcal, restingEnergyKcal, steps, exerciseMinutes, restingHeartRate, weightKg, heightMeters] =
    await Promise.all([
      total('HKQuantityTypeIdentifierActiveEnergyBurned', 'kcal'),
      total('HKQuantityTypeIdentifierBasalEnergyBurned', 'kcal'),
      total('HKQuantityTypeIdentifierStepCount', 'count'),
      total('HKQuantityTypeIdentifierAppleExerciseTime', 'min'),
      average('HKQuantityTypeIdentifierRestingHeartRate', 'count/min'),
      latest('HKQuantityTypeIdentifierBodyMass', 'kg'),
      latest('HKQuantityTypeIdentifierHeight', 'm'),
    ]);

  return {
    activeEnergyKcal,
    totalEnergyKcal:
      activeEnergyKcal === null && restingEnergyKcal === null
        ? null
        : (activeEnergyKcal ?? 0) + (restingEnergyKcal ?? 0),
    steps,
    exerciseMinutes,
    restingHeartRate,
    weightKg,
    heightCm: heightMeters === null ? null : heightMeters * 100,
  };
}

/** Loads the day's health summary, asking for access the first time. */
export function useHealth(day: Date) {
  const available = isHealthAvailable();
  const [summary, setSummary] = useState<HealthSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(available);
  const [authorized, setAuthorized] = useState(false);
  const dayKey = day.toDateString();

  const load = useCallback(async () => {
    if (!available) return;
    setLoading(true);
    try {
      const granted = await requestHealthAccess();
      setAuthorized(granted);
      setSummary(await getHealthSummary(new Date(dayKey)));
    } finally {
      setLoading(false);
    }
  }, [available, dayKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { available, authorized, summary, loading, reload: load };
}

export { startOfToday };
