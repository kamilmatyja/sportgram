import { beforeEach, describe, expect, it, vi } from 'vitest';
import { statisticService, type StatisticResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import Statistics from './Statistics';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: null as null | { id: string; link: string },
    getUser: vi.fn((id: string) => ({
        id,
        link: id === 'runner-1' ? 'ada-runner' : 'ben-cyclist',
        firstName: id === 'runner-1' ? 'Ada' : 'Ben',
        lastName: id === 'runner-1' ? 'Runner' : 'Cyclist',
    })),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => ({ currentUser: mocks.currentUser }) };
});

vi.mock('../../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return {
        ...hooks,
        useUsersMap: () => ({ getUser: mocks.getUser, usersMap: {}, isLoading: false }),
    };
});

vi.mock('../../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        UserInfoCell: ({ user }: { user?: { firstName: string; lastName: string } }) => (
            <span>{user ? `${user.firstName} ${user.lastName}` : 'Nieznany użytkownik'}</span>
        ),
    };
});

const records = [
    {
        userId: 'runner-1',
        discipline: 1,
        distance: 5000,
        time: 1500,
        createdAt: '2026-11-10T09:00:00',
    },
    {
        userId: 'cyclist-1',
        discipline: 2,
        distance: 20000,
        time: 2400,
        createdAt: '2026-11-09T08:00:00',
    },
] as StatisticResource[];

function renderStatistics() {
    return render(<Statistics />, { initialEntries: ['/statistics'] });
}

describe('Statistics', () => {
    beforeEach(() => {
        mocks.currentUser = { id: 'runner-1', link: 'ada-runner' };
        mocks.getUser.mockClear();
        vi.spyOn(statisticService, 'getStatisticRecords').mockResolvedValue({
            data: [records[0]],
            pagination: { total: 1, page: 1, perPage: 10, hasNextPage: false },
        } as never);
        vi.spyOn(statisticService, 'getStatisticProgress').mockResolvedValue({
            data: [records[1]],
            pagination: { total: 1, page: 1, perPage: 10, hasNextPage: false },
        } as never);
    });

    it('shows loading and then record data with a link to the athlete profile', async () => {
        let resolveRecords!: (value: { data: StatisticResource[]; pagination: { total: number } }) => void;
        vi.mocked(statisticService.getStatisticRecords).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveRecords = resolve;
                }) as never,
        );
        renderStatistics();

        expect(document.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0);
        await waitFor(() => expect(resolveRecords).toBeDefined());
        resolveRecords({ data: [records[0]], pagination: { total: 1 } });

        expect(await screen.findByText('Ada Runner')).toBeVisible();
        expect(screen.getByText('Bieganie')).toBeVisible();
        expect(screen.getByText('5km')).toBeVisible();
        expect(screen.getByText('25m')).toBeVisible();
        expect(screen.getByRole('link', { name: 'Szczegóły' })).toHaveAttribute('href', '/users/ada-runner');
        expect(statisticService.getStatisticRecords).toHaveBeenCalledWith({
            params: {
                query: {
                    page: 1,
                    limit: 10,
                    sort: 'time:asc',
                    filter: { discipline: null, distance: null, userIds: null },
                },
            },
        });
    });

    it('switches between records and progress endpoints with appropriate sorting', async () => {
        const user = userEvent.setup();
        renderStatistics();
        expect(await screen.findByText('Ada Runner')).toBeVisible();

        await user.click(screen.getByRole('radio', { name: 'Progres' }));
        expect(await screen.findByText('Ben Cyclist')).toBeVisible();
        expect(statisticService.getStatisticProgress).toHaveBeenCalledWith({
            params: {
                query: {
                    page: 1,
                    limit: 10,
                    sort: 'createdAt:desc',
                    filter: { discipline: null, distance: null, userIds: null },
                },
            },
        });
    });

    it('applies discipline and distance filters and supports sorting and pagination', async () => {
        const user = userEvent.setup();
        vi.mocked(statisticService.getStatisticRecords).mockResolvedValue({
            data: [records[0]],
            pagination: { total: 25, page: 1, perPage: 10, hasNextPage: true },
        } as never);
        renderStatistics();
        expect(await screen.findByText('Ada Runner')).toBeVisible();

        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText('Dystans [m]'), '5000');
        await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
        await user.keyboard('{ArrowDown}{Enter}');

        await waitFor(() => {
            expect(statisticService.getStatisticRecords).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { discipline: 1, distance: 5000, userIds: null },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.click(await screen.findByText('Data utworzenia: od najstarszych'));
        await waitFor(() => {
            expect(statisticService.getStatisticRecords).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ sort: 'createdAt:asc' }) }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(statisticService.getStatisticRecords).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ page: 2 }) }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: 'Wyczyść filtry' }));
        await waitFor(() => {
            expect(statisticService.getStatisticRecords).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { discipline: null, distance: null, userIds: null },
                        }),
                    }),
                }),
            );
        });
    });

    it('shows an empty state for an empty response and when the request fails', async () => {
        vi.mocked(statisticService.getStatisticRecords).mockResolvedValue({
            data: [],
            pagination: { total: 0 },
        } as never);
        const view = renderStatistics();
        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        view.unmount();

        vi.mocked(statisticService.getStatisticRecords).mockRejectedValueOnce(new Error('Request failed'));
        renderStatistics();
        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
    });

    it('does not request statistics without an authenticated user', async () => {
        mocks.currentUser = null;
        renderStatistics();

        expect(statisticService.getStatisticRecords).not.toHaveBeenCalled();
        expect(statisticService.getStatisticProgress).not.toHaveBeenCalled();
        expect(screen.getByText('Brak danych do wyświetlenia')).toBeVisible();
    });
});
