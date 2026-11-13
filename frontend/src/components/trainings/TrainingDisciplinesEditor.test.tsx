import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/test-utils';
import {
    TrainingDisciplinesEditor,
    type FormTrainingDiscipline,
    type FormTrainingDistance,
} from './TrainingDisciplinesEditor';

const gpsMocks = vi.hoisted(() => ({
    distance: {
        id: 'recorded-distance',
        distance: '250',
        time: '75',
        subDistances: [
            {
                id: 'recorded-point',
                subDistance: '0',
                time: '0',
                lat: '0',
                lng: '0',
                accuracy: '4',
                speed: '3',
            },
        ],
    },
    startedAt: new Date('2026-07-12T09:00:00.000Z'),
    endedAt: new Date('2026-07-12T09:01:15.000Z'),
}));

vi.mock('./GpsDistanceRecorderPanel', () => ({
    GpsDistanceRecorderPanel: ({
        onFinish,
        onCancel,
    }: {
        onFinish: (distance: FormTrainingDistance, times: { startedAt: Date; endedAt: Date }) => void;
        onCancel: () => void;
    }) => (
        <div>
            <button
                onClick={() =>
                    onFinish(gpsMocks.distance, {
                        startedAt: gpsMocks.startedAt,
                        endedAt: gpsMocks.endedAt,
                    })
                }
            >
                Zakończ nagrywanie GPS
            </button>
            <button onClick={onCancel}>Anuluj nagrywanie GPS</button>
        </div>
    ),
}));

const initialDiscipline: FormTrainingDiscipline = {
    id: 'running',
    discipline: '1',
    distances: [
        {
            id: 'distance-1',
            distance: '5000',
            time: '1500',
            subDistances: [
                {
                    id: 'point-1',
                    subDistance: '1000',
                    time: '300',
                    lat: '52.1',
                    lng: '21.2',
                    accuracy: '5',
                    speed: '4',
                },
            ],
        },
    ],
};

function renderEditor(initial: FormTrainingDiscipline[] = [initialDiscipline]) {
    const onChange = vi.fn();
    const onSessionTimes = vi.fn();

    function ControlledEditor() {
        const [disciplines, setDisciplines] = useState(initial);

        return (
            <>
                <TrainingDisciplinesEditor
                    disciplines={disciplines}
                    onChange={(next) => {
                        onChange(next);
                        setDisciplines(next);
                    }}
                    onSessionTimes={onSessionTimes}
                />
                <output data-testid="disciplines">{JSON.stringify(disciplines)}</output>
            </>
        );
    }

    render(<ControlledEditor />);
    return { onChange, onSessionTimes };
}

function readDisciplines() {
    const output = screen.getByTestId('disciplines').textContent;
    if (!output) {
        throw new Error('Training discipline state was not rendered');
    }
    return JSON.parse(output) as FormTrainingDiscipline[];
}

function stubGeolocation(getCurrentPosition: (success: PositionCallback, error?: PositionErrorCallback) => void) {
    const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
    Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition: vi.fn(getCurrentPosition) },
    });
    return () => {
        if (original) {
            Object.defineProperty(navigator, 'geolocation', original);
        } else {
            Reflect.deleteProperty(navigator, 'geolocation');
        }
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('TrainingDisciplinesEditor', () => {
    it('adds and edits disciplines, distances, times, sub-distances and GPS measurements', async () => {
        const user = userEvent.setup();
        const { onChange } = renderEditor([]);

        await user.click(screen.getByRole('button', { name: 'Dodaj dyscyplinę' }));
        const addedDiscipline = readDisciplines()[0];
        expect(addedDiscipline).toEqual({ id: expect.any(String), discipline: null, distances: [] });

        await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
        await user.click(await screen.findByText('Bieganie'));
        await user.click(screen.getByRole('button', { name: 'Dodaj dystans ręcznie' }));
        await user.type(screen.getByRole('textbox', { name: 'Dystans [m]' }), '10000');
        await user.type(screen.getByRole('textbox', { name: 'Czas [s]' }), '3600');
        await user.click(screen.getByRole('button', { name: 'Dodaj sub-dystans' }));
        await user.type(screen.getByRole('textbox', { name: 'Sub-dystans [m]' }), '5000');
        await user.type(screen.getAllByRole('textbox', { name: 'Czas [s]' })[1], '1800');
        await user.type(screen.getByRole('textbox', { name: 'Szerokość' }), '52.1234567');
        await user.type(screen.getByRole('textbox', { name: 'Długość' }), '21.9876543');
        await user.type(screen.getByRole('textbox', { name: 'Dokładność' }), '5.6');
        await user.type(screen.getByRole('textbox', { name: 'Prędkość' }), '-3');

        expect(readDisciplines()).toEqual([
            {
                id: addedDiscipline.id,
                discipline: '1',
                distances: [
                    {
                        id: expect.any(String),
                        distance: '10000',
                        time: '3600',
                        subDistances: [
                            {
                                id: expect.any(String),
                                subDistance: '5000',
                                time: '1800',
                                lat: '52.1234567',
                                lng: '21.9876543',
                                accuracy: '5.6',
                                speed: '-3',
                            },
                        ],
                    },
                ],
            },
        ]);
        expect(onChange).toHaveBeenLastCalledWith(readDisciplines());
    });

    it('preserves empty, boundary and invalid values in the form state for the DTO mapper to handle', async () => {
        const user = userEvent.setup();
        renderEditor();

        const latitude = screen.getByRole('textbox', { name: 'Szerokość' });
        const longitude = screen.getByRole('textbox', { name: 'Długość' });
        await user.clear(latitude);
        await user.type(latitude, '-90');
        await user.clear(longitude);
        await user.type(longitude, '180');
        await user.clear(screen.getByRole('textbox', { name: 'Dokładność' }));
        await user.type(screen.getByRole('textbox', { name: 'Dokładność' }), 'not-a-number');
        await user.clear(screen.getByRole('textbox', { name: 'Prędkość' }));

        expect(readDisciplines()[0].distances[0].subDistances[0]).toMatchObject({
            subDistance: '1000',
            time: '300',
            lat: '-90',
            lng: '180',
            accuracy: 'not-a-number',
            speed: '',
        });
    });

    it('removes a distance or sub-distance without changing the other recorded values', async () => {
        const user = userEvent.setup();
        const { onChange } = renderEditor([
            {
                ...initialDiscipline,
                distances: [
                    ...initialDiscipline.distances,
                    { id: 'distance-2', distance: '10000', time: '3600', subDistances: [] },
                ],
            },
        ]);

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[3]);

        expect(readDisciplines()[0].distances).toEqual([
            {
                id: 'distance-1',
                distance: '5000',
                time: '1500',
                subDistances: initialDiscipline.distances[0].subDistances,
            },
        ]);
        expect(onChange).toHaveBeenLastCalledWith(readDisciplines());
    });

    it('removes a selected sub-distance and discipline from the controlled form data', async () => {
        const user = userEvent.setup();
        const { onChange } = renderEditor([initialDiscipline, { id: 'cycling', discipline: '2', distances: [] }]);

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[2]);
        expect(readDisciplines()[0].distances[0].subDistances).toEqual([]);
        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);

        expect(readDisciplines()).toEqual([{ id: 'cycling', discipline: '2', distances: [] }]);
        expect(onChange).toHaveBeenLastCalledWith([{ id: 'cycling', discipline: '2', distances: [] }]);
    });

    it('starts GPS recording only after geolocation succeeds and forwards the recorded distance and session times', async () => {
        const user = userEvent.setup();
        const restoreGeolocation = stubGeolocation((success) =>
            success({
                coords: {
                    latitude: 52.1,
                    longitude: 21.2,
                    accuracy: 5,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                },
                timestamp: Date.now(),
            } as GeolocationPosition),
        );
        try {
            const { onChange, onSessionTimes } = renderEditor();

            await user.click(screen.getByRole('button', { name: 'Nagraj GPS' }));
            await user.click(await screen.findByRole('button', { name: 'Zakończ nagrywanie GPS' }));

            expect(readDisciplines()[0].distances).toEqual([...initialDiscipline.distances, gpsMocks.distance]);
            expect(onChange).toHaveBeenLastCalledWith(readDisciplines());
            expect(onSessionTimes).toHaveBeenCalledWith({
                startedAt: gpsMocks.startedAt,
                endedAt: gpsMocks.endedAt,
            });
            expect(screen.queryByRole('button', { name: 'Zakończ nagrywanie GPS' })).not.toBeInTheDocument();
        } finally {
            restoreGeolocation();
        }
    });

    it('does not open a GPS recording session when geolocation permission is denied', async () => {
        const user = userEvent.setup();
        const restoreGeolocation = stubGeolocation((_success, error) =>
            error?.({
                code: 1,
                message: 'Permission denied',
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
            } as GeolocationPositionError),
        );
        try {
            const { onChange } = renderEditor();

            await user.click(screen.getByRole('button', { name: 'Nagraj GPS' }));

            expect(await screen.findByText(/Brak uprawnień do lokalizacji GPS/)).toBeVisible();
            expect(screen.queryByRole('button', { name: 'Zakończ nagrywanie GPS' })).not.toBeInTheDocument();
            expect(onChange).not.toHaveBeenCalled();
        } finally {
            restoreGeolocation();
        }
    });
});
