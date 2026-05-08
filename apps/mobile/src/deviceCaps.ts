import * as Device from "expo-device";
import { Platform } from "react-native";

/**
 * Runtime device capability detection.
 * Uses cutting-edge features on modern/powerful devices,
 * gracefully degrades on older/low-RAM ones.
 */

/** Android API level (null on iOS/web) */
export const apiLevel: number | null = Device.platformApiLevel;

/** true when running Android 11+ (API 30+) */
export const isModernAndroid: boolean =
  Platform.OS === "android" && (apiLevel ?? 0) >= 30;

/** true when running Android 9 or below (API ≤ 28) */
export const isLegacyAndroid: boolean =
  Platform.OS === "android" && (apiLevel ?? 999) <= 28;

// Heap limit the JVM will allow (Android only).
// Resolved lazily once and cached.
let _maxMemoryMB: number | null = null;
let _memoryPromise: Promise<number> | null = null;

async function resolveMaxMemory(): Promise<number> {
  if (_maxMemoryMB !== null) return _maxMemoryMB;

  if (Platform.OS !== "android") {
    // iOS doesn't expose JVM heap; assume capable.
    _maxMemoryMB = 512;
    return _maxMemoryMB;
  }

  try {
    const bytes = await Device.getMaxMemoryAsync();
    _maxMemoryMB = Math.round(bytes / (1024 * 1024));
  } catch {
    // Fallback: assume constrained if we can't read.
    _maxMemoryMB = 192;
  }

  return _maxMemoryMB;
}

/** Get max JVM heap in MB (cached after first call). */
export function getMaxMemoryMB(): Promise<number> {
  if (!_memoryPromise) {
    _memoryPromise = resolveMaxMemory();
  }
  return _memoryPromise;
}

/**
 * Determine whether the device can handle premium/heavy features
 * like session replay, complex animations, etc.
 *
 * Criteria:  API 30+ AND heap ≥ 256 MB  (or iOS, which is always capable).
 */
export async function isPremiumCapable(): Promise<boolean> {
  if (Platform.OS === "ios") return true;
  if (isLegacyAndroid) return false;

  const heapMB = await getMaxMemoryMB();
  return heapMB >= 256;
}
