import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';
import { feedService, type FeedResource } from '../../api/services';
import type * as CommonModule from '../common';
import type * as InteractionModalModule from '../common/InteractionModal';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';
import { FeedModal } from './FeedModal';

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

const existingFeed = {
    id: 'feed-1',
    text: 'Wspólny trening za nami!',
    photo: 'existing-feed-photo',
} as unknown as FeedResource;

function renderForm(feed?: FeedResource | null) {
    return render(<FeedModal opened onClose={mocks.onClose} onSuccess={mocks.onSuccess} feed={feed} />);
}

describe('FeedModal', () => {
    beforeEach(() => {
        mocks.onClose.mockReset();
        mocks.onSuccess.mockReset();
        notifications.clean();
        vi.spyOn(feedService, 'createFeed').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'updateFeed').mockResolvedValue({} as never);
    });

    it('requires both post text and a photo before allowing creation', async () => {
        const user = userEvent.setup();
        renderForm();
        const save = screen.getByRole('button', { name: 'Zapisz' });

        expect(save).toBeDisabled();
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Nowy wpis');
        expect(save).toBeDisabled();
        expect(feedService.createFeed).not.toHaveBeenCalled();

        await user.upload(screen.getByLabelText('Zdjęcie'), new File(['photo'], 'post.png', { type: 'image/png' }));
        expect(save).toBeEnabled();
    });

    it('creates a post with its text and uploaded photo and closes after success', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Udany trening w parku.');
        await user.upload(screen.getByLabelText('Zdjęcie'), new File(['photo'], 'post.png', { type: 'image/png' }));
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(feedService.createFeed).toHaveBeenCalledWith({
                body: { text: 'Udany trening w parku.', photo: 'cGhvdG8=' },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(await screen.findByText('Utworzono pomyślnie')).toBeVisible();
    });

    it('loads the existing post text and updates it while retaining its photo', async () => {
        const user = userEvent.setup();
        renderForm(existingFeed);

        expect(await screen.findByRole('textbox', { name: 'Treść' })).toHaveValue('Wspólny trening za nami!');
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();
        expect(screen.getByLabelText('Zdjęcie')).not.toBeRequired();

        await user.clear(screen.getByRole('textbox', { name: 'Treść' }));
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Zaktualizowany wpis.');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(feedService.updateFeed).toHaveBeenCalledWith({
                params: { path: { id: 'feed-1' } },
                body: { text: 'Zaktualizowany wpis.', photo: 'existing-feed-photo' },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(await screen.findByText('Zapisano pomyślnie')).toBeVisible();
    });

    it('shows field-level API validation errors and keeps the form open', async () => {
        const user = userEvent.setup();
        vi.mocked(feedService.createFeed).mockRejectedValueOnce({
            errors: [{ field: 'text', message: 'Treść wpisu jest nieprawidłowa' }],
        });
        renderForm();
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Treść wpisu');
        await user.upload(screen.getByLabelText('Zdjęcie'), new File(['photo'], 'post.png', { type: 'image/png' }));
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Treść wpisu jest nieprawidłowa')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });

    it('shows a general API error and does not close the form', async () => {
        const user = userEvent.setup();
        vi.mocked(feedService.createFeed).mockRejectedValueOnce({ message: 'Nie udało się dodać wpisu' });
        renderForm();
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Treść wpisu');
        await user.upload(screen.getByLabelText('Zdjęcie'), new File(['photo'], 'post.png', { type: 'image/png' }));
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Nie udało się dodać wpisu')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });
});
