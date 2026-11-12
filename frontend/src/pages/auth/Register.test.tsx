import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { authService, userService } from '../../api/services';
import { registerSession, signSession } from '../../utils';
import Register from './Register';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

function LocationPath() {
    const location = useLocation();
    return <output aria-label="current location">{location.pathname}</output>;
}

function renderRegister() {
    return render(
        <>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/sign" element={<p>Strona logowania</p>} />
            </Routes>
            <LocationPath />
        </>,
        { initialEntries: ['/register'] },
    );
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/Imię/), 'Ada');
    await user.type(screen.getByLabelText(/Nazwisko/), 'Runner');
    await user.type(screen.getByLabelText(/Email/), 'ada@example.com');
    await user.type(screen.getByLabelText(/Hasło/), 'secret123');
    await user.type(screen.getByLabelText(/Data urodzenia/), '1995-05-20');
    await user.type(screen.getByLabelText(/Telefon/), '123456789');

    await user.click(screen.getByRole('combobox', { name: /Płeć/ }));
    await user.click(await screen.findByText('Kobieta'));

    await user.click(screen.getByRole('combobox', { name: /Kraj/ }));
    await user.type(screen.getByRole('combobox', { name: /Kraj/ }), 'Polska');
    await user.click(await screen.findByText('Polska'));

    await user.click(screen.getByRole('combobox', { name: /Role/ }));
    await user.click(await screen.findByText('Uczestnik'));
}

describe('Register page', () => {
    beforeEach(() => {
        vi.spyOn(userService, 'createUserNano').mockResolvedValue({ id: 'user-created' } as never);
        vi.spyOn(authService, 'register').mockResolvedValue({ id: 'register-123' } as never);
        vi.spyOn(authService, 'confirmRegister').mockResolvedValue({} as never);
        vi.spyOn(authService, 'resendRegister').mockResolvedValue({} as never);
        vi.spyOn(authService, 'sign').mockResolvedValue({ id: 'sign-after-register' } as never);
    });

    it('requires all account fields and links existing users to sign-in', async () => {
        const user = userEvent.setup();
        renderRegister();

        expect(screen.getByRole('heading', { name: 'Rejestracja' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Rejestracja' })).toBeDisabled();
        expect(screen.getByRole('link', { name: 'Logowanie' })).toHaveAttribute('href', '/sign');

        await user.type(screen.getByLabelText(/Imię/), 'Ada');
        await user.type(screen.getByLabelText(/Nazwisko/), 'Runner');
        expect(screen.getByRole('button', { name: 'Rejestracja' })).toBeDisabled();
        expect(userService.createUserNano).not.toHaveBeenCalled();
    });

    it('creates the account, starts email verification and signs in after confirmation', async () => {
        const user = userEvent.setup();
        renderRegister();
        await fillRequiredFields(user);

        expect(screen.getByRole('button', { name: 'Rejestracja' })).toBeEnabled();
        await user.click(screen.getByRole('button', { name: 'Rejestracja' }));

        expect(userService.createUserNano).toHaveBeenCalledWith({
            body: {
                firstName: 'Ada',
                lastName: 'Runner',
                email: 'ada@example.com',
                password: 'secret123',
                birthAt: '1995-05-20',
                gender: 2,
                phone: 123456789,
                country: 35,
                roles: [1],
            },
        });
        expect(authService.register).toHaveBeenCalledWith({ body: { email: 'ada@example.com' } });
        expect(await screen.findByRole('heading', { name: 'Rejestracja – Weryfikacja' })).toBeVisible();
        expect(registerSession.id()).toBe('register-123');
        expect(registerSession.get('email')).toBe('ada@example.com');
        expect(registerSession.get('password')).toBe('secret123');
        expect(screen.getByRole('button', { name: 'Weryfikacja' })).toBeDisabled();

        const codeInputs = screen.getAllByRole('textbox');
        for (const [index, input] of codeInputs.slice(0, 6).entries()) {
            await user.type(input, String(index + 1));
        }
        await user.click(screen.getByRole('button', { name: 'Weryfikacja' }));

        expect(authService.confirmRegister).toHaveBeenCalledWith({
            params: { path: { id: 'register-123' } },
            body: { code: 123456 },
        });
        expect(authService.sign).toHaveBeenCalledWith({
            body: { email: 'ada@example.com', password: 'secret123' },
        });
        expect(signSession.id()).toBe('sign-after-register');
        expect(registerSession.id()).toBeNull();
        await waitFor(() => {
            expect(screen.getByLabelText('current location')).toHaveTextContent('/sign');
        });
    });

    it('shows field-level account creation errors without requesting a verification code', async () => {
        const user = userEvent.setup();
        vi.mocked(userService.createUserNano).mockRejectedValue({
            errors: [{ field: 'email', message: 'Ten adres jest już zajęty' }],
        });
        renderRegister();
        await fillRequiredFields(user);
        await user.click(screen.getByRole('button', { name: 'Rejestracja' }));

        expect(await screen.findByText('Ten adres jest już zajęty')).toBeVisible();
        expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-invalid', 'true');
        expect(authService.register).not.toHaveBeenCalled();
        expect(screen.getByRole('heading', { name: 'Rejestracja' })).toBeVisible();
    });

    it('reports an API failure when requesting registration verification', async () => {
        const user = userEvent.setup();
        vi.mocked(authService.register).mockRejectedValue(new Error('Nie można wysłać kodu'));
        renderRegister();
        await fillRequiredFields(user);
        await user.click(screen.getByRole('button', { name: 'Rejestracja' }));

        expect(await screen.findByText('Nie można wysłać kodu')).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Rejestracja' })).toBeVisible();
        expect(registerSession.id()).toBeNull();
    });

    it('shows verification errors, supports resend and returns to the form', async () => {
        const user = userEvent.setup();
        registerSession.start('register-existing', { email: 'ada@example.com', password: 'secret123' });
        vi.mocked(authService.confirmRegister).mockRejectedValue({
            errors: [{ field: 'code', message: 'Kod wygasł' }],
        });
        renderRegister();

        expect(screen.getByRole('heading', { name: 'Rejestracja – Weryfikacja' })).toBeVisible();
        const codeInputs = screen.getAllByRole('textbox');
        for (const [index, input] of codeInputs.slice(0, 6).entries()) {
            await user.type(input, String(index + 1));
        }
        await user.click(screen.getByRole('button', { name: 'Weryfikacja' }));
        expect(await screen.findByText('Kod wygasł')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Wyślij kod ponownie' }));
        expect(authService.resendRegister).toHaveBeenCalledWith({
            params: { path: { id: 'register-existing' } },
        });

        await user.click(screen.getByRole('button', { name: 'Powrót' }));
        expect(screen.getByRole('heading', { name: 'Rejestracja' })).toBeVisible();
        expect(registerSession.id()).toBeNull();
    });
});
