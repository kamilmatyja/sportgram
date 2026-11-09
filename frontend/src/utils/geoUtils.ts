export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export const COORD_MULTIPLIER = 1_000_000;

export function coordToBackendInt(coord: number | null | undefined): number | null {
    if (coord == null || isNaN(coord)) return null;
    return Math.round(coord * COORD_MULTIPLIER);
}

export function coordFromBackendInt(val: number | null | undefined): number | null {
    if (val == null || isNaN(val)) return null;
    if (Math.abs(val) > 180) {
        return val / COORD_MULTIPLIER;
    }
    return val;
}

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

export {
    formatDistance,
    formatTime,
    formatTimeSeconds,
    formatSpeed,
    formatPace,
    calculateSpeed,
    calculatePace,
    calculateSplitSpeed,
    calculateSplitPace,
} from './format';
