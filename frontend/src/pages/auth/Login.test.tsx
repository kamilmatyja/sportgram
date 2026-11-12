import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { authStorage } from '../../api/client';
import { authService } from '../../api/services';
import type * as AuthModule from '../../auth';
import { registerSession, signSession, UNCONFIRMED_ACCOUNT_ERROR } from '../../utils';
import Login from './Login';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => ({ login: mocks.login }) };
});

function LocationPath() {
    const location = useLocation();
    return <output aria-label="current location">{location.pathname}</output>;
}

describe('Login page', () => {
    beforeEach(() => {
        mocks.login.mockReset();
        vi.spyOn(authService, 'sign').mockResolvedValue({ id: 'sign-123' } as never);
        vi.spyOn(authService, 'confirmSign').mockResolvedValue({ token: 'verified-jwt' } as never);
        vi.spyOn(authService, 'resendSign').mockResolvedValue({} as never);
        vi.spyOn(authService, 'register').mockResolvedValue({ id: 'register-456' } as never);
    });

    it('validates required fields and exposes the guest navigation links', async () => {
        const user = userEvent.setup();
        render(<Login />, { initialEntries: ['/sign'] });

        expect(screen.getByRole('button', { name: 'Logowanie' })).toBeDisabled();
        expect(screen.getByRole('link', { name: 'Resetowanie hasła?' })).toHaveAttribute('href', '/password-reset');
        expect(screen.getByRole('link', { name: 'Rejestracja' })).toHaveAttribute('href', '/register');

        await user.type(screen.getByLabelText(/Email/), 'runner@example.com');
        expect(screen.getByRole('button', { name: 'Logowanie' })).toBeDisabled();
        await user.type(screen.getByLabelText(/Hasło/), 'secret123');
        expect(screen.getByRole('button', { name: 'Logowanie' })).toBeEnabled();
    });

    it('completes two-factor login and honors remember-me selection', async () => {
        const user = userEvent.setup();
        render(
            <>
                <Login />
                <LocationPath />
            </>,
            { initialEntries: ['/sign'] },
        );

        await user.type(screen.getByLabelText(/Email/), 'runner@example.com');
        await user.type(screen.getByLabelText(/Hasło/), 'secret123');
        await user.click(screen.getByRole('checkbox', { name: 'Zapamiętaj mnie' }));
        await user.click(screen.getByRole('button', { name: 'Logowanie' }));

        expect(await screen.findByRole('heading', { name: 'Logowanie – Weryfikacja' })).toBeVisible();
        expect(signSession.id()).toBe('sign-123');
        expect(signSession.get('rememberMe')).toBe('1');
        expect(authService.sign).toHaveBeenCalledWith({
            body: { email: 'runner@example.com', password: 'secret123' },
        });

        const codeInputs = screen.getAllByRole('textbox');
        for (const [index, input] of codeInputs.slice(0, 6).entries()) {
            await user.type(input, String(index + 1));
        }
        await user.click(screen.getByRole('button', { name: 'Weryfikacja' }));

        expect(authService.confirmSign).toHaveBeenCalledWith({
            params: { path: { id: 'sign-123' } },
            body: { code: 123456 },
        });
        expect(mocks.login).toHaveBeenCalledWith('verified-jwt', 'sign-123', true);
        expect(await screen.findByLabelText('current location')).toHaveTextContent('/');
        expect(signSession.id()).toBeNull();
    });

    it('displays verification errors and allows requesting another code', async () => {
        const user = userEvent.setup();
        signSession.start('sign-resend');
        vi.mocked(authService.confirmSign).mockRejectedValue({
            errors: [{ field: 'code', message: 'Kod jest nieprawidłowy' }],
        });
        render(<Login />, { initialEntries: ['/sign'] });

        expect(screen.getByRole('heading', { name: 'Logowanie – Weryfikacja' })).toBeVisible();
        const codeInputs = screen.getAllByRole('textbox');
        for (const [index, input] of codeInputs.slice(0, 6).entries()) {
            await user.type(input, String(index + 1));
        }
        await user.click(screen.getByRole('button', { name: 'Weryfikacja' }));
        expect(await screen.findByText('Kod jest nieprawidłowy')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Wyślij kod ponownie' }));
        expect(authService.resendSign).toHaveBeenCalledWith({
            params: { path: { id: 'sign-resend' } },
        });
    });

    it('returns to the credentials step and clears the pending verification session', async () => {
        const user = userEvent.setup();
        signSession.start('sign-back', { rememberMe: '1' });
        render(<Login />, { initialEntries: ['/sign'] });

        await user.click(screen.getByRole('button', { name: 'Powrót' }));

        expect(screen.getByRole('heading', { name: 'Logowanie' })).toBeVisible();
        expect(screen.getByLabelText(/Email/)).toBeVisible();
        expect(signSession.id()).toBeNull();
        expect(signSession.step()).toBe(1);
    });

    it('starts registration verification when the account is unconfirmed', async () => {
        const user = userEvent.setup();
        vi.mocked(authService.sign).mockRejectedValue(new Error(UNCONFIRMED_ACCOUNT_ERROR));
        render(
            <>
                <Login />
                <LocationPath />
            </>,
            { initialEntries: ['/sign'] },
        );

        await user.type(screen.getByLabelText(/Email/), 'unconfirmed@example.com');
        await user.type(screen.getByLabelText(/Hasło/), 'secret123');
        await user.click(screen.getByRole('button', { name: 'Logowanie' }));

        await waitFor(() => {
            expect(authService.register).toHaveBeenCalledWith({
                body: { email: 'unconfirmed@example.com' },
            });
        });
        expect(registerSession.id()).toBe('register-456');
        expect(registerSession.get('email')).toBe('unconfirmed@example.com');
        expect(registerSession.get('password')).toBe('secret123');
        expect(signSession.id()).toBeNull();
        await waitFor(() => {
            expect(screen.getByLabelText('current location')).toHaveTextContent('/register');
        });
    });

    it('keeps API failure visible instead of advancing to verification', async () => {
        const user = userEvent.setup();
        vi.mocked(authService.sign).mockRejectedValue(new Error('Usługa logowania niedostępna'));
        render(<Login />, { initialEntries: ['/sign'] });

        await user.type(screen.getByLabelText(/Email/), 'runner@example.com');
        await user.type(screen.getByLabelText(/Hasło/), 'secret123');
        await user.click(screen.getByRole('button', { name: 'Logowanie' }));

        expect(await screen.findByText('Usługa logowania niedostępna')).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Logowanie' })).toBeVisible();
        expect(mocks.login).not.toHaveBeenCalled();
        expect(authStorage.getToken()).toBeNull();
    });
});
