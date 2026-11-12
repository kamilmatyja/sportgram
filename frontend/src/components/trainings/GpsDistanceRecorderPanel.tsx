import { useState, useEffect, useRef, useMemo } from 'react';
import { Stack, Group, Button, Badge, Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlayerPlay, IconPlayerPause, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useWakeLock } from '../../hooks';
import {
    calculateHaversineDistance,
    formatDistance,
    formatPace,
    formatSpeed,
    formatTime,
    calculatePace,
    calculateSpeed,
    generateUuid,
} from '../../utils';
import { TrainingRouteMap, type RoutePoint } from './TrainingRouteMap';
import type { FormTrainingDistance } from './TrainingDisciplinesEditor';
import { DeleteActionButton } from '../common';

export interface TelemetryPoint extends RoutePoint {
    accuracy: number | null;
    speed: number | null;
    subDistance: number;
    time: number;
}

export interface GpsDistanceRecorderPanelProps {
    onFinish: (distance: FormTrainingDistance, times: { startedAt: Date; endedAt: Date }) => void;
    onCancel: () => void;
}

type RecorderStatus = 'idle' | 'recording' | 'paused';

export function GpsDistanceRecorderPanel({ onFinish, onCancel }: GpsDistanceRecorderPanelProps) {
    const { t } = useTranslation();

    const [status, setStatus] = useState<RecorderStatus>('idle');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [totalDistance, setTotalDistance] = useState(0);
    const [points, setPoints] = useState<TelemetryPoint[]>([]);
    const [currentPos, setCurrentPos] = useState<{
        lat: number;
        lng: number;
        accuracy: number;
        speed: number | null;
    } | null>(null);

    const [startedAt, setStartedAt] = useState<Date | null>(null);

    useWakeLock(status === 'recording' || status === 'paused');

    const watchIdRef = useRef<number | null>(null);
    const lastPointRef = useRef<TelemetryPoint | null>(null);
    const statusRef = useRef(status);
    statusRef.current = status;
    const elapsedRef = useRef(elapsedSeconds);
    elapsedRef.current = elapsedSeconds;
    const totalDistanceRef = useRef(totalDistance);
    totalDistanceRef.current = totalDistance;

    useEffect(() => {
        if (status !== 'recording') return;

        const interval = setInterval(() => {
            setElapsedSeconds((s) => s + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [status]);

    useEffect(() => {
        if (!navigator.geolocation) {
            notifications.show({
                id: 'gps-status-error',
                color: 'red',
                title: t('gps'),
                message: t('gpsPermissionDenied'),
            });
            onCancel();
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy, speed } = position.coords;

            let calculatedSpeed: number | null = speed != null && speed >= 0 ? speed : null;

            if (lastPointRef.current) {
                const deltaMeters = calculateHaversineDistance(
                    lastPointRef.current.lat,
                    lastPointRef.current.lng,
                    latitude,
                    longitude,
                );
                const deltaSeconds = elapsedRef.current - lastPointRef.current.time;
                if (calculatedSpeed == null && deltaSeconds > 0 && deltaMeters > 0) {
                    calculatedSpeed = deltaMeters / deltaSeconds;
                }
            }

            setCurrentPos({
                lat: latitude,
                lng: longitude,
                accuracy,
                speed: calculatedSpeed,
            });

            if (statusRef.current !== 'recording') {
                return;
            }

            if (!lastPointRef.current) {
                const initialPoint: TelemetryPoint = {
                    lat: latitude,
                    lng: longitude,
                    accuracy,
                    speed: calculatedSpeed,
                    subDistance: 0,
                    time: elapsedRef.current,
                };
                lastPointRef.current = initialPoint;
                setPoints([initialPoint]);
                return;
            }

            const deltaMeters = calculateHaversineDistance(
                lastPointRef.current.lat,
                lastPointRef.current.lng,
                latitude,
                longitude,
            );
            if (deltaMeters >= 2) {
                const newTotalDistance = totalDistanceRef.current + deltaMeters;
                const currentPoint: TelemetryPoint = {
                    lat: latitude,
                    lng: longitude,
                    accuracy,
                    speed: calculatedSpeed,
                    subDistance: newTotalDistance,
                    time: elapsedRef.current,
                };
                totalDistanceRef.current = newTotalDistance;
                setTotalDistance(newTotalDistance);
                lastPointRef.current = currentPoint;
                setPoints((prev) => [...prev, currentPoint]);
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            if (error.code === error.PERMISSION_DENIED) {
                notifications.show({
                    id: 'gps-status-error',
                    color: 'red',
                    title: t('gps'),
                    message: t('gpsPermissionDenied'),
                });
                onCancel();
                return;
            }
            const message = error.code === error.TIMEOUT ? t('gpsTimeout') : t('gpsPositionUnavailable');
            notifications.show({
                id: 'gps-status-error',
                color: 'red',
                title: t('gps'),
                message,
            });
        };

        watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [onCancel, t]);

    const handleStart = () => {
        setStartedAt(new Date());
        setStatus('recording');
        setElapsedSeconds(0);
        setTotalDistance(0);
        lastPointRef.current = null;
        if (currentPos) {
            const initialPoint: TelemetryPoint = {
                lat: currentPos.lat,
                lng: currentPos.lng,
                accuracy: currentPos.accuracy,
                speed: currentPos.speed,
                subDistance: 0,
                time: 0,
            };
            lastPointRef.current = initialPoint;
            setPoints([initialPoint]);
        } else {
            setPoints([]);
        }
    };

    const handlePause = () => {
        setStatus('paused');
    };

    const handleResume = () => {
        setStatus('recording');
    };

    const downsampleSubDistances = (allPoints: TelemetryPoint[]): TelemetryPoint[] => {
        if (allPoints.length <= 1) return allPoints;

        const result: TelemetryPoint[] = [allPoints[0]];
        let lastAccepted = allPoints[0];

        for (let i = 1; i < allPoints.length; i++) {
            const pt = allPoints[i];
            const isLast = i === allPoints.length - 1;
            const timeDiff = Math.abs(pt.time - lastAccepted.time);
            const distDiff = Math.abs(pt.subDistance - lastAccepted.subDistance);

            if (timeDiff >= 10 && distDiff >= 10) {
                result.push(pt);
                lastAccepted = pt;
            } else if (isLast) {
                if (timeDiff >= 2 || distDiff >= 2) {
                    result.push(pt);
                }
            }
        }

        return result;
    };

    const handleFinish = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        const finishTime = new Date();
        const sessionStart = startedAt || new Date(finishTime.getTime() - elapsedSeconds * 1000);

        let finalPoints = [...points];
        if (currentPos) {
            const lastPt = finalPoints[finalPoints.length - 1];
            if (!lastPt) {
                finalPoints = [
                    {
                        lat: currentPos.lat,
                        lng: currentPos.lng,
                        accuracy: currentPos.accuracy,
                        speed: currentPos.speed,
                        subDistance: Math.round(totalDistance),
                        time: elapsedSeconds,
                    },
                ];
            } else if (
                Math.abs(lastPt.subDistance - totalDistance) >= 1 ||
                Math.abs(lastPt.time - elapsedSeconds) >= 1
            ) {
                finalPoints.push({
                    lat: currentPos.lat,
                    lng: currentPos.lng,
                    accuracy: currentPos.accuracy,
                    speed: currentPos.speed,
                    subDistance: Math.round(totalDistance),
                    time: elapsedSeconds,
                });
            }
        }

        const sampledSubDistances = downsampleSubDistances(finalPoints);

        const newDistance: FormTrainingDistance = {
            id: generateUuid(),
            distance: String(Math.round(totalDistance)),
            time: String(Math.round(elapsedSeconds)),
            subDistances: sampledSubDistances.map((p, idx) => {
                let speedMps = p.speed;
                if (speedMps == null || speedMps <= 0) {
                    if (idx > 0) {
                        const prev = sampledSubDistances[idx - 1];
                        const dt = p.time - prev.time;
                        const dm = p.subDistance - prev.subDistance;
                        speedMps = dt > 0 ? dm / dt : 0;
                    } else if (sampledSubDistances.length > 1) {
                        const next = sampledSubDistances[1];
                        const dt = next.time - p.time;
                        const dm = next.subDistance - p.subDistance;
                        speedMps = dt > 0 ? dm / dt : 0;
                    } else if (elapsedSeconds > 0 && totalDistance > 0) {
                        speedMps = totalDistance / elapsedSeconds;
                    } else {
                        speedMps = 0;
                    }
                }
                const roundedSpeed = Math.round(speedMps);
                const finalSpeed = p.subDistance > 0 || totalDistance > 0 ? Math.max(1, roundedSpeed) : roundedSpeed;

                return {
                    id: generateUuid(),
                    subDistance: String(Math.round(p.subDistance)),
                    time: String(Math.round(p.time)),
                    lat: String(p.lat),
                    lng: String(p.lng),
                    accuracy: p.accuracy != null ? String(Math.round(p.accuracy)) : '',
                    speed: String(finalSpeed),
                };
            }),
        };

        onFinish(newDistance, { startedAt: sessionStart, endedAt: finishTime });
    };

    const handleDiscard = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        onCancel();
    };

    const currentPaceSecPerKm = useMemo(() => {
        if (!currentPos?.speed || currentPos.speed <= 0.2) return 0;
        return 1000 / currentPos.speed;
    }, [currentPos?.speed]);

    const currentSpeedKmH = useMemo(() => {
        if (!currentPos?.speed || currentPos.speed <= 0.2) return 0;
        return currentPos.speed * 3.6;
    }, [currentPos?.speed]);

    const averagePaceSecPerKm = useMemo(() => {
        return calculatePace(totalDistance, elapsedSeconds);
    }, [totalDistance, elapsedSeconds]);

    const averageSpeedKmH = useMemo(() => {
        return calculateSpeed(totalDistance, elapsedSeconds);
    }, [totalDistance, elapsedSeconds]);

    const gpsAccuracyBadge = useMemo(() => {
        if (!currentPos) {
            return (
                <Badge color="gray" variant="light">
                    {t('gpsSearching')}
                </Badge>
            );
        }
        if (currentPos.accuracy <= 10) {
            return (
                <Badge color="green" variant="light">
                    {t('gpsSignalGood')} (&plusmn;{Math.round(currentPos.accuracy)}m)
                </Badge>
            );
        }
        if (currentPos.accuracy <= 30) {
            return (
                <Badge color="yellow" variant="light">
                    {t('gpsSignal')} (&plusmn;{Math.round(currentPos.accuracy)}m)
                </Badge>
            );
        }
        return (
            <Badge color="orange" variant="light">
                {t('gpsSignalWeak')} (&plusmn;{Math.round(currentPos.accuracy)}m)
            </Badge>
        );
    }, [currentPos, t]);

    return (
        <Paper p="sm" mt="xs" bg="var(--mantine-color-gray-light)">
            <Stack gap="sm">
                <Group grow gap="xs">
                    <div className="gps-metric-card">
                        <div className="gps-metric-val">{formatDistance(totalDistance)}</div>
                        <div className="gps-metric-lbl">{t('distance')}</div>
                    </div>
                    <div className="gps-metric-card">
                        <div className="gps-metric-val">{formatTime(elapsedSeconds)}</div>
                        <div className="gps-metric-lbl">{t('time')}</div>
                    </div>
                    <div className="gps-metric-card">
                        <div className="gps-metric-val">
                            {formatPace(status === 'idle' ? 0 : currentPaceSecPerKm || averagePaceSecPerKm)}
                        </div>
                        <div className="gps-metric-lbl">{t('pace')}</div>
                    </div>
                    <div className="gps-metric-card">
                        <div className="gps-metric-val">
                            {formatSpeed(status === 'idle' ? 0 : currentSpeedKmH || averageSpeedKmH)}
                        </div>
                        <div className="gps-metric-lbl">{t('speed')}</div>
                    </div>
                </Group>

                <TrainingRouteMap points={points} currentPosition={currentPos} isLive={status === 'recording'} />

                <Group justify="space-between" align="center" gap="xs">
                    <div>{gpsAccuracyBadge}</div>

                    <Group gap="xs" align="center">
                        {status === 'idle' && (
                            <Button size="xs" leftSection={<IconPlayerPlay size={16} />} onClick={handleStart}>
                                {t('startMeasurement')}
                            </Button>
                        )}

                        {status === 'recording' && (
                            <>
                                <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<IconPlayerPause size={16} />}
                                    onClick={handlePause}
                                >
                                    {t('pause')}
                                </Button>
                                <Button size="xs" leftSection={<IconCheck size={16} />} onClick={handleFinish}>
                                    {t('finish')}
                                </Button>
                            </>
                        )}

                        {status === 'paused' && (
                            <>
                                <Button size="xs" leftSection={<IconPlayerPlay size={16} />} onClick={handleResume}>
                                    {t('resume')}
                                </Button>
                                <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<IconCheck size={16} />}
                                    onClick={handleFinish}
                                >
                                    {t('finish')}
                                </Button>
                            </>
                        )}

                        <DeleteActionButton onClick={() => handleDiscard()} />
                    </Group>
                </Group>
            </Stack>
        </Paper>
    );
}
