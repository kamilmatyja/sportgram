import { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface RoutePoint {
    lat: number;
    lng: number;
    subDistance?: number;
    time?: number;
}

export interface TrainingRouteMapProps {
    points: RoutePoint[];
    currentPosition?: { lat: number; lng: number } | null;
    isLive?: boolean;
    tall?: boolean;
    flat?: boolean;
    className?: string;
}

export function TrainingRouteMap({
    points,
    currentPosition,
    isLive = false,
    tall = false,
    flat = false,
    className,
}: TrainingRouteMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);
    const startMarkerRef = useRef<L.Marker | null>(null);
    const finishMarkerRef = useRef<L.Marker | null>(null);
    const currentMarkerRef = useRef<L.Marker | null>(null);

    // Initialize map
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const defaultCenter: L.LatLngExpression =
            points.length > 0
                ? [points[0].lat, points[0].lng]
                : currentPosition
                  ? [currentPosition.lat, currentPosition.lng]
                  : [52.2297, 21.0122];

        const map = L.map(containerRef.current, {
            center: defaultCenter,
            zoom: 15,
            zoomControl: true,
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const polyline = L.polyline([], {
            color: '#228be6',
            weight: 5,
            opacity: 0.85,
            lineJoin: 'round',
        }).addTo(map);

        mapRef.current = map;
        polylineRef.current = polyline;

        // Invalidate map size on layout shifts
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            map.remove();
            mapRef.current = null;
            polylineRef.current = null;
            startMarkerRef.current = null;
            finishMarkerRef.current = null;
            currentMarkerRef.current = null;
        };
    }, []);

    // Update polyline and markers when points or currentPosition change
    useEffect(() => {
        const map = mapRef.current;
        const polyline = polylineRef.current;
        if (!map || !polyline) return;

        const latLngs: L.LatLngExpression[] = points.map((p) => [p.lat, p.lng]);
        polyline.setLatLngs(latLngs);

        // Start marker
        if (points.length > 0) {
            const startPos: L.LatLngExpression = [points[0].lat, points[0].lng];
            if (!startMarkerRef.current) {
                const startIcon = L.divIcon({
                    className: 'route-map-start-marker',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                });
                startMarkerRef.current = L.marker(startPos, { icon: startIcon }).addTo(map);
            } else {
                startMarkerRef.current.setLatLng(startPos);
            }
        } else if (startMarkerRef.current) {
            startMarkerRef.current.remove();
            startMarkerRef.current = null;
        }

        // Finish marker (for completed / static routes)
        if (!isLive && points.length > 1) {
            const finishPos: L.LatLngExpression = [points[points.length - 1].lat, points[points.length - 1].lng];
            if (!finishMarkerRef.current) {
                const finishIcon = L.divIcon({
                    className: 'route-map-finish-marker',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                });
                finishMarkerRef.current = L.marker(finishPos, { icon: finishIcon }).addTo(map);
            } else {
                finishMarkerRef.current.setLatLng(finishPos);
            }
        } else if (finishMarkerRef.current) {
            finishMarkerRef.current.remove();
            finishMarkerRef.current = null;
        }

        // Current position marker (for live recording)
        if (isLive && currentPosition) {
            const curPos: L.LatLngExpression = [currentPosition.lat, currentPosition.lng];
            if (!currentMarkerRef.current) {
                const currentIcon = L.divIcon({
                    className: 'route-map-current-marker',
                    html: '<div class="route-map-current-dot"></div><div class="route-map-current-pulse"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                });
                currentMarkerRef.current = L.marker(curPos, { icon: currentIcon }).addTo(map);
            } else {
                currentMarkerRef.current.setLatLng(curPos);
            }

            // Follow current position in live mode
            map.panTo(curPos, { animate: true });
        } else if (!isLive && currentMarkerRef.current) {
            currentMarkerRef.current.remove();
            currentMarkerRef.current = null;
        }

        // Fit bounds for static view
        if (!isLive && points.length > 0) {
            const bounds = polyline.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 });
            }
        }
    }, [points, currentPosition, isLive]);

    const containerClass = className
        ? className
        : flat
          ? 'route-map-container-flat'
          : tall
            ? 'route-map-container-tall'
            : 'route-map-container';

    return <div ref={containerRef} className={containerClass} />;
}
