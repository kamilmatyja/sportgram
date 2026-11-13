import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';
import { storyService, type StoryResource } from '../../api/services';
import type * as CommonModule from '../common';
import type * as InteractionModalModule from '../common/InteractionModal';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';
import { StoryModal } from './StoryModal';

const mocks = vi.hoisted(() => ({
    onClose: vi.fn(),
    onSuccess: vi.fn(),
}));

vi.mock('../common', async (importOriginal: () => Promise<typeof CommonModule>) => {
    const common = await importOriginal();
    return {
        ...common,
        ImageInput: ({
            label,
            onChange,
            error,
            required,
        }: {
            label: string;
            onChange: (file: File | null) => void;
            error?: string;
            required?: boolean;
        }) => (
            <label>
                {label}
                {required && <span aria-label="required">*</span>}
                <input
                    type="file"
                    aria-label={label}
                    accept="image/*"
                    onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)}
                />
                {error && <span>{error}</span>}
            </label>
        ),
    };
});

vi.mock('../common/InteractionModal', async (importOriginal: () => Promise<typeof InteractionModalModule>) => {
    const common = await importOriginal();
    return {
        ...common,
        InteractionModal: ({ children, title }: { children: React.ReactNode; title: string }) => (
            <div role="dialog" aria-label={title}>
                {children}
            </div>
        ),
    };
});

const existingStory = {
    id: 'story-1',
    userId: 'owner-1',
    text: 'Wschód słońca na szlaku',
    photo: 'existing-story-photo',
    status: 1,
} as unknown as StoryResource;

function renderForm(story?: StoryResource | null) {
    return render(<StoryModal opened onClose={mocks.onClose} onSuccess={mocks.onSuccess} story={story} />);
}

describe('StoryModal', () => {
    beforeEach(() => {
        mocks.onClose.mockReset();
        mocks.onSuccess.mockReset();
        notifications.clean();
        vi.spyOn(storyService, 'createStory').mockResolvedValue({ id: 'story-new' } as never);
        vi.spyOn(storyService, 'updateStory').mockResolvedValue({ id: 'story-updated' } as never);
    });

    it('requires story text and a photo before allowing creation', async () => {
        const user = userEvent.setup();
        renderForm();
        const save = screen.getByRole('button', { name: 'Zapisz' });

        expect(save).toBeDisabled();
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Moja relacja');
        expect(save).toBeDisabled();
        expect(storyService.createStory).not.toHaveBeenCalled();

        await user.upload(
            screen.getByLabelText('Zdjęcie'),
            new File(['story-photo'], 'story.png', { type: 'image/png' }),
        );
        expect(save).toBeEnabled();
    });

    it('does not allow creation when the story text contains only whitespace', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), '   ');
        await user.upload(
            screen.getByLabelText('Zdjęcie'),
            new File(['story-photo'], 'story.png', { type: 'image/png' }),
        );

        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeDisabled();
        expect(storyService.createStory).not.toHaveBeenCalled();
    });

    it('creates a story with its text and uploaded photo and closes after success', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Piękny dzień na szlaku.');
        await user.upload(
            screen.getByLabelText('Zdjęcie'),
            new File(['story-photo'], 'story.png', { type: 'image/png' }),
        );
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(storyService.createStory).toHaveBeenCalledWith({
                body: { text: 'Piękny dzień na szlaku.', photo: 'c3RvcnktcGhvdG8=' },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledWith(undefined);
        expect(await screen.findByText('Utworzono pomyślnie')).toBeVisible();
    });

    it('loads the existing story and updates its text while keeping the existing photo', async () => {
        const user = userEvent.setup();
        renderForm(existingStory);

        expect(await screen.findByRole('textbox', { name: 'Treść' })).toHaveValue('Wschód słońca na szlaku');
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();
        expect(screen.getByLabelText('Zdjęcie')).not.toBeRequired();

        await user.clear(screen.getByRole('textbox', { name: 'Treść' }));
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Zaktualizowana relacja.');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(storyService.updateStory).toHaveBeenCalledWith({
                params: { path: { id: 'story-1' } },
                body: { text: 'Zaktualizowana relacja.', photo: 'existing-story-photo' },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledWith({
            ...existingStory,
            id: 'story-updated',
            text: 'Zaktualizowana relacja.',
            photo: 'existing-story-photo',
        });
        expect(await screen.findByText('Zapisano pomyślnie')).toBeVisible();
    });

    it('does not allow updating a story when its text contains only whitespace', async () => {
        const user = userEvent.setup();
        renderForm(existingStory);

        await user.clear(screen.getByRole('textbox', { name: 'Treść' }));
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), '   ');

        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeDisabled();
        expect(storyService.updateStory).not.toHaveBeenCalled();
    });

    it('shows field-level API validation errors and keeps the form open', async () => {
        const user = userEvent.setup();
        vi.mocked(storyService.createStory).mockRejectedValueOnce({
            errors: [{ field: 'text', message: 'Treść relacji jest nieprawidłowa' }],
        });
        renderForm();
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Treść relacji');
        await user.upload(
            screen.getByLabelText('Zdjęcie'),
            new File(['story-photo'], 'story.png', { type: 'image/png' }),
        );
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Treść relacji jest nieprawidłowa')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });

    it('shows a general API error and does not close the form', async () => {
        const user = userEvent.setup();
        vi.mocked(storyService.createStory).mockRejectedValueOnce({ message: 'Nie udało się dodać relacji' });
        renderForm();
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Treść relacji');
        await user.upload(
            screen.getByLabelText('Zdjęcie'),
            new File(['story-photo'], 'story.png', { type: 'image/png' }),
        );
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Nie udało się dodać relacji')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });

    it('shows update validation errors and keeps the edit form open', async () => {
        const user = userEvent.setup();
        vi.mocked(storyService.updateStory).mockRejectedValueOnce({
            errors: [{ field: 'text', message: 'Nie można zapisać tej relacji' }],
        });
        renderForm(existingStory);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Nie można zapisać tej relacji')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });
});
