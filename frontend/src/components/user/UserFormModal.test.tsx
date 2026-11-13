import { beforeEach, describe, expect, it, vi } from 'vitest';
import { userService, type UserResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import { UserFormModal } from './UserFormModal';
import { fireEvent, render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    refetchUser: vi.fn(),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => ({ refetchUser: mocks.refetchUser }) };
});

vi.mock('../common/InteractionModal', () => ({
    InteractionModal: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>,
}));

vi.mock('../common/ImageInput', () => ({
    ImageInput: ({
        label,
        value,
        onChange,
    }: {
        label: string;
        value: File | null;
        onChange: (file: File | null) => void;
    }) => (
        <label>
            {label}
            <input
                type="file"
                aria-label={label}
                accept="image/*"
                onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)}
            />
            {value && <span>{value.name}</span>}
        </label>
    ),
}));

const existingUser = {
    id: 'user-1',
    firstName: 'Ada',
    lastName: 'Runner',
    email: 'ada@example.test',
    link: 'ada-runner',
    phone: 123456789,
    birthAt: '1990-04-03T00:00:00',
    gender: 2,
    country: 35,
    language: 1,
    theme: 1,
    color: 1,
    bio: 'Lubię biegać.',
    profilePhoto: 'existing-profile-photo',
    backgroundPhoto: 'existing-background-photo',
    roles: [
        { id: 'role-1', role: 1 },
        { id: 'role-2', role: 2 },
    ],
    disciplines: [{ id: 'discipline-1', discipline: 1 }],
} as unknown as UserResource;

function renderForm(user?: UserResource | null) {
    return render(<UserFormModal opened onClose={mocks.onClose} onSuccess={mocks.onSuccess} user={user} />);
}

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
    await user.click(screen.getByRole('combobox', { name: label }));
    await user.click(await screen.findByText(option));
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByRole('textbox', { name: 'Imię' }), 'Jan');
    await user.type(screen.getByRole('textbox', { name: 'Nazwisko' }), 'Kowalski');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'jan@example.test');
    await user.type(screen.getByPlaceholderText('••••••••'), 'strong-password');
    await user.clear(screen.getByRole('textbox', { name: 'Link' }));
    await user.type(screen.getByRole('textbox', { name: 'Link' }), 'jan-kowalski');
    await user.type(screen.getByRole('textbox', { name: 'Telefon' }), '987654321');
    const birthDateInput = document.querySelector<HTMLInputElement>('input[type="date"]');
    if (!birthDateInput) {
        throw new Error('Birth date input was not rendered');
    }
    await user.type(birthDateInput, '1995-02-14');
    await selectOption(user, 'Płeć', 'Mężczyzna');
    await selectOption(user, 'Kraj', 'Polska');
    await selectOption(user, 'Język', 'Polski');
    await selectOption(user, 'Motyw', 'Jasny');
    await selectOption(user, 'Kolor', 'Niebieski');
    await selectOption(user, 'Role', 'Uczestnik');
    await selectOption(user, 'Dyscypliny', 'Bieganie');
    await user.type(screen.getByRole('textbox', { name: 'Opis' }), 'Biegam rekreacyjnie.');
}

describe('UserFormModal', () => {
    beforeEach(() => {
        mocks.onClose.mockReset();
        mocks.onSuccess.mockReset();
        mocks.refetchUser.mockReset();
        vi.spyOn(userService, 'createUser').mockResolvedValue({} as never);
        vi.spyOn(userService, 'updateUser').mockResolvedValue({} as never);
        vi.spyOn(userService, 'getUser').mockResolvedValue({ data: existingUser } as never);
    });

    it('requires all creation fields including a password, role and both photos', async () => {
        const user = userEvent.setup();
        renderForm();
        const save = screen.getByRole('button', { name: 'Zapisz' });

        expect(save).toBeDisabled();
        await user.type(screen.getByRole('textbox', { name: 'Imię' }), 'Jan');
        expect(save).toBeDisabled();
        expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('creates a user with selected roles, disciplines and uploaded photos', async () => {
        const user = userEvent.setup();
        renderForm();
        await fillRequiredFields(user);

        const save = screen.getByRole('button', { name: 'Zapisz' });
        expect(save).toBeDisabled();
        await user.upload(
            screen.getByLabelText('Zdjęcie profilowe'),
            new File(['profile'], 'profile.png', { type: 'image/png' }),
        );
        await user.upload(
            screen.getByLabelText('Zdjęcie w tle'),
            new File(['background'], 'background.png', { type: 'image/png' }),
        );
        expect(save).toBeEnabled();
        await user.click(save);

        await waitFor(() => {
            expect(userService.createUser).toHaveBeenCalledWith({
                body: {
                    firstName: 'Jan',
                    lastName: 'Kowalski',
                    email: 'jan@example.test',
                    link: 'jan-kowalski',
                    phone: 987654321,
                    birthAt: '1995-02-14',
                    gender: 1,
                    country: 35,
                    language: 2,
                    theme: 2,
                    color: 3,
                    bio: 'Biegam rekreacyjnie.',
                    profilePhoto: 'cHJvZmlsZQ==',
                    backgroundPhoto: 'YmFja2dyb3VuZA==',
                    roles: [1],
                    disciplines: [1],
                    password: 'strong-password',
                },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(mocks.refetchUser).not.toHaveBeenCalled();
    }, 20000);

    it('loads existing user roles and disciplines and updates without replacing existing photos', async () => {
        const user = userEvent.setup();
        renderForm(existingUser);

        expect(await screen.findByRole('textbox', { name: 'Imię' })).toHaveValue('Ada');
        expect(screen.getByRole('textbox', { name: 'Nazwisko' })).toHaveValue('Runner');
        expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('ada@example.test');
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();

        fireEvent.change(screen.getByRole('textbox', { name: 'Opis' }), {
            target: { value: 'Nowy opis profilu.' },
        });
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(userService.updateUser).toHaveBeenCalledWith({
                params: { path: { id: 'user-1' } },
                body: {
                    firstName: 'Ada',
                    lastName: 'Runner',
                    email: 'ada@example.test',
                    link: 'ada-runner',
                    phone: 123456789,
                    birthAt: '1990-04-03',
                    gender: 2,
                    country: 35,
                    language: 1,
                    theme: 1,
                    color: 1,
                    bio: 'Nowy opis profilu.',
                    profilePhoto: 'existing-profile-photo',
                    backgroundPhoto: 'existing-background-photo',
                    roles: [1, 2],
                    disciplines: [1],
                    password: null,
                },
            });
        });
        expect(mocks.refetchUser).toHaveBeenCalledOnce();
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
    });

    it('shows field-level API validation errors and keeps the form open', async () => {
        const user = userEvent.setup();
        vi.mocked(userService.updateUser).mockRejectedValueOnce({
            errors: [{ field: 'email', message: 'Ten adres jest już zajęty' }],
        });
        renderForm(existingUser);
        await screen.findByRole('textbox', { name: 'Imię' });
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Ten adres jest już zajęty')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });
});
