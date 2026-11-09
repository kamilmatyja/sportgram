/**
 * Format distance in meters or kilometers without spaces:
 * - < 1000: e.g. "500m", "0m"
 * - >= 1000:
 *   - whole km: "1km"
 *   - incomplete km with whole hundreds (tenths): "1,1km" (for 1100 m)
 *   - incomplete hundreds: rounded to 2 decimal places: "1,11km"
 */
export function formatDistance(meters: number | null | undefined): string {
    if (meters == null || !isFinite(meters)) {
        return '-';
    }
    const m = Math.round(meters);
    if (m >= 1000) {
        if (m % 1000 === 0) {
            return `${m / 1000}km`;
        }
        if (m % 100 === 0) {
            return `${(m / 1000).toFixed(1).replace('.', ',')}km`;
        }
        const kmVal = Number((m / 1000).toFixed(2));
        return `${kmVal.toString().replace('.', ',')}km`;
    }
    return `${m}m`;
}

/**
 * Format time in seconds to compact units without commas:
 * - < 60: e.g. "45s", "0s"
 * - >= 60 and < 3600: e.g. "1m 18s", "1m"
 * - >= 3600: e.g. "1h 47m 32s", "1h 2m", "1h"
 */
export function formatTime(totalSeconds: number | null | undefined): string {
    if (totalSeconds == null || !isFinite(totalSeconds)) {
        return '-';
    }
    const s = Math.max(0, Math.round(totalSeconds));
    if (s < 60) {
        return `${s}s`;
    }
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    const parts: string[] = [];
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    if (seconds > 0) {
        parts.push(`${seconds}s`);
    }
    return parts.join(' ');
}

// Backward-compatible alias
export const formatTimeSeconds = formatTime;

/**
 * Calculate speed in km/h from distance in meters and time in seconds.
 * Returns 0 if inputs are invalid or <= 0.
 */
export function calculateSpeed(
    distanceMeters: number | null | undefined,
    timeSeconds: number | null | undefined,
): number {
    if (
        distanceMeters == null ||
        timeSeconds == null ||
        !isFinite(distanceMeters) ||
        !isFinite(timeSeconds) ||
        distanceMeters <= 0 ||
        timeSeconds <= 0
    ) {
        return 0;
    }
    return (distanceMeters / timeSeconds) * 3.6;
}

/**
 * Calculate pace in seconds per kilometer (sec/km) from distance in meters and time in seconds.
 * Returns 0 if inputs are invalid or <= 0.
 */
export function calculatePace(
    distanceMeters: number | null | undefined,
    timeSeconds: number | null | undefined,
): number {
    if (
        distanceMeters == null ||
        timeSeconds == null ||
        !isFinite(distanceMeters) ||
        !isFinite(timeSeconds) ||
        distanceMeters <= 0 ||
        timeSeconds <= 0
    ) {
        return 0;
    }
    return (timeSeconds / distanceMeters) * 1000;
}

/**
 * Calculate speed for a split interval.
 * Automatically resolves whether inputs are cumulative checkpoints or standalone segments.
 */
export function calculateSplitSpeed(
    curDist: number | null | undefined,
    prevDist: number | null | undefined,
    curTime: number | null | undefined,
    prevTime: number | null | undefined,
): number {
    const cDist = Number(curDist) || 0;
    const pDist = Number(prevDist) || 0;
    const cTime = Number(curTime) || 0;
    const pTime = Number(prevTime) || 0;

    const deltaDist = cDist > pDist && cTime > pTime ? cDist - pDist : cDist;
    const deltaTime = cDist > pDist && cTime > pTime ? cTime - pTime : cTime;

    return calculateSpeed(deltaDist, deltaTime);
}

/**
 * Calculate pace for a split interval.
 * Automatically resolves whether inputs are cumulative checkpoints or standalone segments.
 */
export function calculateSplitPace(
    curDist: number | null | undefined,
    prevDist: number | null | undefined,
    curTime: number | null | undefined,
    prevTime: number | null | undefined,
): number {
    const cDist = Number(curDist) || 0;
    const pDist = Number(prevDist) || 0;
    const cTime = Number(curTime) || 0;
    const pTime = Number(prevTime) || 0;

    const deltaDist = cDist > pDist && cTime > pTime ? cDist - pDist : cDist;
    const deltaTime = cDist > pDist && cTime > pTime ? cTime - pTime : cTime;

    return calculatePace(deltaDist, deltaTime);
}

/**
 * Format speed in km/h (e.g. "12,4 km/h").
 * For very small positive speeds (< 0.1 km/h), formats with 2 decimals (e.g. "0,03 km/h")
 * to avoid misleading "0,0 km/h".
 */
export function formatSpeed(speedKmH: number | null | undefined): string {
    if (speedKmH == null || !isFinite(speedKmH) || speedKmH <= 0) {
        return '-';
    }
    if (speedKmH < 0.1) {
        if (speedKmH < 0.01) {
            return '< 0,01 km/h';
        }
        return `${speedKmH.toFixed(2).replace('.', ',')} km/h`;
    }
    return `${speedKmH.toFixed(1).replace('.', ',')} km/h`;
}

/**
 * Format pace in min/km (e.g. "5:23 /km") or h:mm:ss /km (e.g. "1:01:00 /km") when > 60:00 /km.
 */
export function formatPace(secPerKm: number | null | undefined): string {
    if (secPerKm == null || !isFinite(secPerKm) || secPerKm <= 0) {
        return '-';
    }
    const totalSec = Math.round(secPerKm);
    if (totalSec <= 0) {
        return '-';
    }
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} /km`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}
