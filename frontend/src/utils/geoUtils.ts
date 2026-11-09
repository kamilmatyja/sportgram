/**
 * Calculate distance between two GPS coordinates using the Haversine formula.
 * @returns Distance in meters
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's mean radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Backend stores coordinates as integers (microdegrees = deg * 1,000,000).
 */
export const COORD_MULTIPLIER = 1_000_000;

export function coordToBackendInt(coord: number | null | undefined): number | null {
    if (coord == null || isNaN(coord)) return null;
    return Math.round(coord * COORD_MULTIPLIER);
}

export function coordFromBackendInt(val: number | null | undefined): number | null {
    if (val == null || isNaN(val)) return null;
    // If value is greater than 180 (or < -180), it was scaled by 1,000,000
    if (Math.abs(val) > 180) {
        return val / COORD_MULTIPLIER;
    }
    return val;
}

/**
 * Format pace in min/km (e.g. "5:23 /km").
 * If pace is undefined, null, or out of reasonable bounds, returns "-".
 */
export function formatPace(secPerKm: number | null | undefined): string {
    if (secPerKm == null || !isFinite(secPerKm) || secPerKm <= 0 || secPerKm > 3600) {
        return '0:00 /km';
    }
    const minutes = Math.floor(secPerKm / 60);
    const seconds = Math.floor(secPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

/**
 * Format speed in km/h (e.g. "12.4 km/h").
 */
export function formatSpeed(speedKmH: number | null | undefined): string {
    if (speedKmH == null || !isFinite(speedKmH) || speedKmH < 0) {
        return '-';
    }
    return `${speedKmH.toFixed(1)} km/h`;
}

/**
 * Format duration in seconds to HH:MM:SS or MM:SS.
 */
export function formatDuration(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format distance in meters or kilometers.
 */
export function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
}
