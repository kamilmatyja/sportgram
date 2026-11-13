import { act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';
import { render, screen, userEvent } from '../../test/test-utils';
import type * as HooksModule from '../../hooks';
import { GpsDistanceRecorderPanel } from './GpsDistanceRecorderPanel';

const mocks = vi.hoisted(() => ({
    map: vi.fn(),
    cancel: vi.fn(),
    finish: vi.fn(),
}));

vi.mock('./TrainingRouteMap', () => ({
    TrainingRouteMap: mocks.map,
}));

vi.mock('../../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return { ...hooks, useWakeLock: vi.fn() };
});

interface GeolocationStub {
    watchPosition: ReturnType<typeof vi.fn>;
    clearWatch: ReturnType<typeof vi.fn>;
    succeed: PositionCallback;
    fail: PositionErrorCallback;
}

let originalGeolocation: PropertyDescriptor | undefined;

function installGeolocation() {
    let succeed: PositionCallback = () => {};
    let fail: PositionErrorCallback = () => {};
    const geolocation: GeolocationStub = {
        watchPosition: vi.fn((success: PositionCallback, error: PositionErrorCallback) => {
            succeed = success;
            fail = error;
            return 42;
        }),
        clearWatch: vi.fn(),
        succeed: (position) => succeed(position),
        fail: (error) => fail(error),
    };

    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: geolocation });
    return geolocation;
}

function position(latitude: number, longitude: number, speed: number | null = 2, accuracy = 5): GeolocationPosition {
    return {
        coords: {
            latitude,
            longitude,
            accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed,
        },
        timestamp: Date.now(),
    } as GeolocationPosition;
}

function positionError(code: number, message: string): GeolocationPositionError {
    return {
        code,
        message,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
    } as GeolocationPositionError;
}

beforeEach(() => {
    originalGeolocation = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
    mocks.cancel.mockReset();
    mocks.finish.mockReset();
    notifications.clean();
});

afterEach(() => {
    cleanup();
    if (originalGeolocation) {
        Object.defineProperty(navigator, 'geolocation', originalGeolocation);
    } else {
        Reflect.deleteProperty(navigator, 'geolocation');
    }
    vi.restoreAllMocks();
});

describe('GpsDistanceRecorderPanel', () => {
    it('reports unsupported geolocation and cancels recording', async () => {
        Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
        render(<GpsDistanceRecorderPanel onFinish={mocks.finish} onCancel={mocks.cancel} />);

        expect(await screen.findByText(/Brak uprawnień do lokalizacji GPS/)).toBeVisible();
        expect(mocks.cancel).toHaveBeenCalledOnce();
        expect(mocks.finish).not.toHaveBeenCalled();
    });

    it('starts, pauses, resumes and finishes a GPS recording with measured points and session times', async () => {
        const user = userEvent.setup();
        const geolocation = installGeolocation();
        render(<GpsDistanceRecorderPanel onFinish={mocks.finish} onCancel={mocks.cancel} />);

        expect(geolocation.watchPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });

        act(() => geolocation.succeed(position(52.1, 21.2)));
        expect(await screen.findByText(/Dobry sygnał GPS/)).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Rozpocznij pomiar' }));

        expect(screen.getByRole('button', { name: 'Wstrzymaj' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Wstrzymaj' }));
        expect(screen.getByRole('button', { name: 'Wznów' })).toBeVisible();
        expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
        act(() => geolocation.succeed(position(52.101, 21.2)));
        await user.click(screen.getByRole('button', { name: 'Wznów' }));
        expect(screen.getByRole('button', { name: 'Wstrzymaj' })).toBeVisible();

        act(() => geolocation.succeed(position(52.102, 21.2)));
        expect(screen.getByText('0m')).toBeVisible();
        act(() => geolocation.succeed(position(52.103, 21.2)));
        await user.click(screen.getByRole('button', { name: 'Zakończ' }));

        expect(mocks.finish).toHaveBeenCalledOnce();
        const [distance, times] = mocks.finish.mock.calls[0];
        expect(Number(distance.distance)).toBeGreaterThan(100);
        expect(Number(distance.distance)).toBeLessThan(130);
        expect(distance.time).toBe('0');
        expect(distance.subDistances).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ lat: '52.1', lng: '21.2', accuracy: '5' }),
                expect.objectContaining({ lat: '52.103', lng: '21.2', accuracy: '5' }),
            ]),
        );
        expect(times.startedAt).toBeInstanceOf(Date);
        expect(times.endedAt).toBeInstanceOf(Date);
        expect(times.endedAt.getTime()).toBeGreaterThanOrEqual(times.startedAt.getTime());
        expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
        expect(mocks.cancel).not.toHaveBeenCalled();
    });

    it('does not add positions with poor accuracy to the route or distance', async () => {
        const user = userEvent.setup();
        const geolocation = installGeolocation();
        render(<GpsDistanceRecorderPanel onFinish={mocks.finish} onCancel={mocks.cancel} />);

        act(() => geolocation.succeed(position(52.1, 21.2)));
        await user.click(screen.getByRole('button', { name: 'Rozpocznij pomiar' }));
        act(() => geolocation.succeed(position(52.2, 21.2, 2, 50)));
        await user.click(screen.getByRole('button', { name: 'Zakończ' }));

        const [distance] = mocks.finish.mock.calls[0];
        expect(Number(distance.distance)).toBe(0);
        expect(distance.subDistances).toHaveLength(1);
        expect(distance.subDistances[0]).toMatchObject({ lat: '52.1', lng: '21.2' });
    });

    it('cancels the recording when geolocation permission is denied', async () => {
        const geolocation = installGeolocation();
        render(<GpsDistanceRecorderPanel onFinish={mocks.finish} onCancel={mocks.cancel} />);

        act(() => geolocation.fail(positionError(1, 'Permission denied')));

        expect(await screen.findByText(/Brak uprawnień do lokalizacji GPS/)).toBeVisible();
        expect(mocks.cancel).toHaveBeenCalledOnce();
        expect(mocks.finish).not.toHaveBeenCalled();
    });

    it.each([
        [2, /Sygnał GPS jest niedostępny/],
        [3, /Przekroczono limit czasu oczekiwania na pozycję GPS/],
    ])('displays a geolocation error (code %i) without finishing or cancelling', async (code, message) => {
        const geolocation = installGeolocation();
        render(<GpsDistanceRecorderPanel onFinish={mocks.finish} onCancel={mocks.cancel} />);

        act(() => geolocation.fail(positionError(code, 'GPS error')));

        expect(await screen.findByText(message)).toBeVisible();
        expect(mocks.cancel).not.toHaveBeenCalled();
        expect(mocks.finish).not.toHaveBeenCalled();
    });
});
