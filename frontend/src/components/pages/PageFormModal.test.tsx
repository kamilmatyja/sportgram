import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pageService, type PageResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';
import { PageFormModal } from './PageFormModal';

const mocks = vi.hoisted(() => ({
    onClose: vi.fn(),
    onSuccess: vi.fn(),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => ({ currentUser: { id: 'owner-1' } }) };
});

vi.mock('../common/InteractionModal', () => ({
    InteractionModal: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div role="dialog" aria-label={title}>
            {children}
        </div>
    ),
}));

vi.mock('../common', () => ({
    ImageInput: ({ label, onChange }: { label: string; onChange: (file: File | null) => void }) => (
        <label>
            {label}
            <input
                type="file"
                aria-label={label}
                accept="image/*"
                onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)}
            />
        </label>
    ),
}));

const existingPage = {
    id: 'page-1',
    userId: 'owner-1',
    title: 'Klub Biegacza',
    description: 'Biegamy razem.',
    link: 'klub-biegacza',
    profilePhoto: 'existing-profile-photo',
    backgroundPhoto: 'existing-background-photo',
    color: 2,
    participants: [
        { id: 'participant-owner', userId: 'owner-1' },
        { id: 'participant-friend', userId: 'friend-1' },
    ],
} as unknown as PageResource;

const collaborators = [
    { value: 'friend-1', label: 'Anna Biegaczka' },
    { value: 'friend-2', label: 'Jan Kolarz' },
];

function renderForm(page?: PageResource | null) {
    return render(
        <PageFormModal
            opened
            onClose={mocks.onClose}
            onSuccess={mocks.onSuccess}
            page={page}
            collaboratorOptions={collaborators}
        />,
    );
}

async function selectColor(user: ReturnType<typeof userEvent.setup>, label: string) {
    await user.click(screen.getByRole('combobox', { name: 'Kolor' }));
    await user.click(await screen.findByText(label));
}

async function fillPageFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByRole('textbox', { name: 'Tytuł' }), 'Klub Rowerowy');
    await user.type(screen.getByRole('textbox', { name: 'Opis' }), 'Wspólne wycieczki rowerowe.');
    await selectColor(user, 'Zielony');
    await user.upload(
        screen.getByLabelText('Zdjęcie profilowe'),
        new File(['profile'], 'profile.png', { type: 'image/png' }),
    );
    await user.upload(
        screen.getByLabelText('Zdjęcie w tle'),
        new File(['background'], 'background.png', { type: 'image/png' }),
    );
}

describe('PageFormModal', () => {
    beforeEach(() => {
        mocks.onClose.mockReset();
        mocks.onSuccess.mockReset();
        vi.spyOn(pageService, 'createPage').mockResolvedValue({} as never);
        vi.spyOn(pageService, 'updatePage').mockResolvedValue({} as never);
    });

    it('requires page details, a color and both photos before allowing creation', async () => {
        const user = userEvent.setup();
        renderForm();
        const save = screen.getByRole('button', { name: 'Zapisz' });

        expect(save).toBeDisabled();
        await user.type(screen.getByRole('textbox', { name: 'Tytuł' }), 'Nowa strona');
        expect(save).toBeDisabled();
        expect(pageService.createPage).not.toHaveBeenCalled();
    });

    it('creates a page with selected collaborators and uploaded photos, then closes on success', async () => {
        const user = userEvent.setup();
        renderForm();
        await fillPageFields(user);

        await user.click(screen.getByRole('combobox', { name: 'Współuczestnicy' }));
        await user.click(await screen.findByText('Anna Biegaczka'));
        await user.click(screen.getByRole('combobox', { name: 'Współuczestnicy' }));
        await user.click(await screen.findByText('Jan Kolarz'));
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(pageService.createPage).toHaveBeenCalledWith({
                body: {
                    title: 'Klub Rowerowy',
                    description: 'Wspólne wycieczki rowerowe.',
                    link: 'klub-rowerowy',
                    color: 2,
                    profilePhoto: 'cHJvZmlsZQ==',
                    backgroundPhoto: 'YmFja2dyb3VuZA==',
                    userIds: ['owner-1', 'friend-1', 'friend-2'],
                },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(await screen.findByText('Utworzono pomyślnie')).toBeVisible();
    });

    it('edits existing page details and collaborators while retaining existing photos', async () => {
        const user = userEvent.setup();
        renderForm(existingPage);

        expect(await screen.findByRole('textbox', { name: 'Tytuł' })).toHaveValue('Klub Biegacza');
        expect(screen.getByRole('textbox', { name: 'Opis' })).toHaveValue('Biegamy razem.');
        expect(screen.getByRole('textbox', { name: 'Link' })).toHaveValue('klub-biegacza');
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();

        await user.clear(screen.getByRole('textbox', { name: 'Opis' }));
        await user.type(screen.getByRole('textbox', { name: 'Opis' }), 'Nowy opis klubu.');
        await user.click(screen.getByRole('combobox', { name: 'Współuczestnicy' }));
        await user.click(await screen.findByText('Jan Kolarz'));
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(pageService.updatePage).toHaveBeenCalledWith({
                params: { path: { id: 'page-1' } },
                body: {
                    title: 'Klub Biegacza',
                    description: 'Nowy opis klubu.',
                    link: 'klub-biegacza',
                    color: 2,
                    profilePhoto: 'existing-profile-photo',
                    backgroundPhoto: 'existing-background-photo',
                    userIds: ['owner-1', 'friend-1', 'friend-2'],
                },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(await screen.findByText('Zapisano pomyślnie')).toBeVisible();
    });

    it('shows field-level API validation errors and keeps the form open', async () => {
        const user = userEvent.setup();
        vi.mocked(pageService.createPage).mockRejectedValueOnce({
            errors: [{ field: 'title', message: 'Tytuł strony jest już zajęty' }],
        });
        renderForm();
        await fillPageFields(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Tytuł strony jest już zajęty')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });

    it('shows a general API error and does not close the form', async () => {
        const user = userEvent.setup();
        vi.mocked(pageService.createPage).mockRejectedValueOnce({ message: 'Nie udało się zapisać strony' });
        renderForm();
        await fillPageFields(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Nie udało się zapisać strony')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });
});
