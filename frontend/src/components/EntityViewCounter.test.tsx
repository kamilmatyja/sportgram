import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntryTypeEnum } from '../enums/EntryTypeEnum';
import { render, screen, waitFor } from '../test/test-utils';
import { EntityViewCounter } from './EntityViewCounter';

const { getEntries } = vi.hoisted(() => ({ getEntries: vi.fn() }));

vi.mock('../api/services', () => ({
    entryService: {
        getEntries,
        createEntry: vi.fn(),
    },
}));

vi.mock('../auth', async (importOriginal) => ({
    ...(await importOriginal()),
    useAuth: () => ({ currentUser: { id: 'viewer' } }),
}));

describe('EntityViewCounter', () => {
    beforeEach(() => {
        getEntries.mockReset();
    });

    it('fetches and displays the total view count for the entity', async () => {
        getEntries.mockResolvedValue({ pagination: { total: 17 } });

        render(<EntityViewCounter entityId="event-1" type={EntryTypeEnum.EVENT} track={false} />);

        expect(await screen.findByText('17')).toBeVisible();
        expect(getEntries).toHaveBeenCalledWith({
            params: {
                query: {
                    filter: { entityIds: ['event-1'], type: EntryTypeEnum.EVENT },
                    limit: 1,
                },
            },
        });
    });

    it('shows the initial count while loading and updates it when the response arrives', async () => {
        let resolveEntries: (result: { pagination: { total: number } }) => void = () => {};
        getEntries.mockReturnValue(
            new Promise((resolve) => {
                resolveEntries = resolve;
            }),
        );

        render(<EntityViewCounter entityId="page-1" type={EntryTypeEnum.PAGE} track={false} />);

        expect(screen.getByText('0')).toBeVisible();
        resolveEntries({ pagination: { total: 4 } });
        expect(await screen.findByText('4')).toBeVisible();
    });

    it('shows zero when the response has no pagination count', async () => {
        getEntries.mockResolvedValue({});

        render(<EntityViewCounter entityId="story-1" type={EntryTypeEnum.STORY} track={false} />);

        expect(await screen.findByText('0')).toBeVisible();
    });

    it('shows zero when fetching the count fails', async () => {
        getEntries.mockRejectedValue(new Error('Failed to fetch view count'));

        render(<EntityViewCounter entityId="goal-1" type={EntryTypeEnum.GOAL} track={false} />);

        await waitFor(() => expect(getEntries).toHaveBeenCalledOnce());
        expect(screen.getByText('0')).toBeVisible();
    });

    it('does not render a counter without an entity id', () => {
        render(<EntityViewCounter entityId={null} type={EntryTypeEnum.FEED} track={false} />);

        expect(screen.queryByText('0')).not.toBeInTheDocument();
        expect(getEntries).not.toHaveBeenCalled();
    });
});
