import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storyService, type StoryResource, type UserResource } from '../api/services';
import type * as AuthModule from '../auth';
import type * as UtilsModule from '../utils';
import { render, screen, userEvent, waitFor, within } from '../test/test-utils';
import { StoryViewerModal, type UserStoriesGroup } from './StoryViewerModal';

const mocks = vi.hoisted(() => ({
    currentUser: null as { id: string } | null,
    openConfirmActionModal: vi.fn(),
}));

vi.mock('../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return {
        ...auth,
        useAuth: () => ({ currentUser: mocks.currentUser }),
    };
});

vi.mock('../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return {
        ...utils,
        openConfirmActionModal: mocks.openConfirmActionModal,
    };
});

vi.mock('./EntityViewCounter', () => ({
    EntityViewCounter: () => null,
}));

const firstStory = {
    id: 'story-1',
    userId: 'owner-1',
    text: 'Pierwsza relacja',
    photo: 'first-photo',
    createdAt: '2026-11-13T10:00:00Z',
} as unknown as StoryResource;

const secondStory = {
    ...firstStory,
    id: 'story-2',
    text: 'Druga relacja',
    photo: 'second-photo',
} as StoryResource;

const otherUserStory = {
    ...firstStory,
    id: 'story-3',
    userId: 'owner-2',
    text: 'Relacja innego użytkownika',
} as StoryResource;

const owner = { id: 'owner-1', firstName: 'Ala', lastName: 'Kowalska' } as UserResource;
const groups: UserStoriesGroup[] = [
    { userId: 'owner-1', author: owner, stories: [firstStory, secondStory] },
    { userId: 'owner-2', author: null, stories: [otherUserStory] },
];

function renderViewer(props: Partial<React.ComponentProps<typeof StoryViewerModal>> = {}) {
    return render(<StoryViewerModal opened onClose={vi.fn()} groups={groups} paginateUserStories={false} {...props} />);
}

describe('StoryViewerModal', () => {
    beforeEach(() => {
        mocks.currentUser = null;
        mocks.openConfirmActionModal.mockReset();
        vi.spyOn(storyService, 'getStories').mockResolvedValue({
            data: [],
            pagination: { hasNextPage: false },
        } as never);
    });

    it('opens the selected story and closes from the modal close button', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        renderViewer({ onClose, story: firstStory, groups: undefined });

        expect(await screen.findByRole('dialog')).toBeVisible();
        expect(screen.getByText('Pierwsza relacja')).toBeVisible();
        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '' }));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('navigates between stories and groups in both directions', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        renderViewer({ onClose });

        expect(screen.getByText('Pierwsza relacja')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Następna' }));
        expect(screen.getByText('Druga relacja')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Następna' }));
        expect(screen.getByText('Relacja innego użytkownika')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Poprzednie' }));
        expect(screen.getByText('Druga relacja')).toBeVisible();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('shows edit and delete actions only for the current user’s stories', async () => {
        const user = userEvent.setup();
        const onEdit = vi.fn();
        const onDelete = vi.fn();
        mocks.currentUser = { id: 'owner-1' };
        renderViewer({ onEdit, onDelete });

        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        expect(onEdit).toHaveBeenCalledWith(firstStory);

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.openConfirmActionModal).toHaveBeenCalledOnce();
        const confirmation = mocks.openConfirmActionModal.mock.calls[0][0];
        expect(confirmation.title).toBe('Potwierdzenie usunięcia');
        confirmation.onConfirm();
        expect(onDelete).toHaveBeenCalledWith(firstStory.id);

        await user.click(screen.getByRole('button', { name: 'Następna' }));
        expect(screen.getByText('Druga relacja')).toBeVisible();
    });

    it('hides owner actions for a different user', () => {
        mocks.currentUser = { id: 'someone-else' };
        renderViewer({ onEdit: vi.fn(), onDelete: vi.fn() });

        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
    });

    it('renders nothing when no stories are available', () => {
        renderViewer({ groups: [], story: null });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('keeps the selected story open when loading additional stories fails', async () => {
        vi.mocked(storyService.getStories).mockRejectedValueOnce(new Error('Nie udało się pobrać relacji'));
        const onClose = vi.fn();
        renderViewer({ paginateUserStories: true });

        expect(await screen.findByText('Pierwsza relacja')).toBeVisible();
        await waitFor(() => {
            expect(storyService.getStories).toHaveBeenCalled();
        });
        expect(screen.getByRole('dialog')).toBeVisible();
        expect(onClose).not.toHaveBeenCalled();
    });
});
