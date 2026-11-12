import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { authService } from '../../api/services';
import { passwordResetSession, signSession } from '../../utils';
import PasswordReset from './PasswordReset';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

function LocationPath() {
    const location = useLocation();
    return <output aria-label="current location">{location.pathname}</output>;
}

function renderPasswordReset() {
    return render(
        <>
            <Routes>
                <Route path="/password-reset" element={<PasswordReset />} />
                <Route path="/sign" element={<p>Strona logowania</p>} />
            </Routes>
            <LocationPath />
        </>,
        { initialEntries: ['/password-reset'] },
    );
}

async function enterVerificationCode(user: ReturnType<typeof userEvent.setup>) {
    const inputs = screen.getAllByRole('textbox');
    for (const [index, input] of inputs.slice(0, 6).entries()) {
        await user.type(input, String(index + 1));
    }
}

describe('PasswordReset page', () => {
    beforeEach(() => {
        vi.spyOn(authService, 'passwordReset').mockResolvedValue({ id: 'reset-123' } as never);
        vi.spyOn(authService, 'confirmPasswordReset').mockResolvedValue({} as never);
        vi.spyOn(authService, 'resendPasswordReset').mockResolvedValue({} as never);
        vi.spyOn(authService, 'sign').mockResolvedValue({ id: 'sign-after-reset' } as never);
    });

    it('requires an email and provides a link back to sign-in', async () => {
        const user = userEvent.setup();
        renderPasswordReset();

        expect(screen.getByRole('heading', { name: 'Resetowanie hasła' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Wyślij' })).toBeDisabled();
        expect(screen.getByRole('link', { name: 'Logowanie' })).toHaveAttribute('href', '/sign');

        await user.type(screen.getByLabelText(/Email/), 'runner@example.com');
        expect(screen.getByRole('button', { name: 'Wyślij' })).toBeEnabled();
    });

    it('requests a reset code, validates the new password, and returns to sign-in after success', async () => {
        const user = userEvent.setup();
        renderPasswordReset();

        await user.type(screen.getByLabelText(/Email/), 'runner@example.com');
        await user.click(screen.getByRole('button', { name: 'Wyślij' }));

        expect(authService.passwordReset).toHaveBeenCalledWith({
            body: { email: 'runner@example.com' },
        });
        expect(await screen.findByRole('heading', { name: 'Resetowanie hasła – Weryfikacja' })).toBeVisible();
        expect(passwordResetSession.id()).toBe('reset-123');
        expect(passwordResetSession.get('email')).toBe('runner@example.com');
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeDisabled();

        await user.type(screen.getByLabelText(/Nowe hasło/), 'new-secret');
        await enterVerificationCode(user);
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(authService.confirmPasswordReset).toHaveBeenCalledWith({
            params: { path: { id: 'reset-123' } },
            body: { password: 'new-secret', code: 123456 },
        });
        expect(authService.sign).toHaveBeenCalledWith({
            body: { email: 'runner@example.com', password: 'new-secret' },
        });
        expect(passwordResetSession.id()).toBeNull();
        expect(signSession.id()).toBe('sign-after-reset');
        await waitFor(() => {
            expect(screen.getByLabelText('current location')).toHaveTextContent('/sign');
        });
    });

    it('shows field-level errors for an invalid verification code and allows retry', async () => {
        const user = userEvent.setup();
        passwordResetSession.start('reset-invalid', { email: 'runner@example.com' });
        vi.mocked(authService.confirmPasswordReset).mockRejectedValue({
            errors: [{ field: 'code', message: 'Kod jest nieprawidłowy' }],
        });
        renderPasswordReset();

        await user.type(screen.getByLabelText(/Nowe hasło/), 'new-secret');
        await enterVerificationCode(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Kod jest nieprawidłowy')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();
        expect(authService.sign).not.toHaveBeenCalled();
        expect(passwordResetSession.id()).toBe('reset-invalid');
    });

    it('resends the code and displays resend API errors', async () => {
        const user = userEvent.setup();
        passwordResetSession.start('reset-resend', { email: 'runner@example.com' });
        vi.mocked(authService.resendPasswordReset).mockRejectedValue(new Error('Nie można wysłać kodu'));
        renderPasswordReset();

        await user.click(screen.getByRole('button', { name: 'Wyślij kod ponownie' }));

        expect(authService.resendPasswordReset).toHaveBeenCalledWith({
            params: { path: { id: 'reset-resend' } },
        });
        expect(await screen.findByText('Nie można wysłać kodu')).toBeVisible();
    });

    it('reports reset request errors without advancing to verification', async () => {
        const user = userEvent.setup();
        vi.mocked(authService.passwordReset).mockRejectedValue({
            errors: [{ field: 'email', message: 'Nie znaleziono konta' }],
        });
        renderPasswordReset();

        await user.type(screen.getByLabelText(/Email/), 'missing@example.com');
        await user.click(screen.getByRole('button', { name: 'Wyślij' }));

        expect(await screen.findByText('Nie znaleziono konta')).toBeVisible();
        expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('heading', { name: 'Resetowanie hasła' })).toBeVisible();
        expect(passwordResetSession.id()).toBeNull();
    });

    it('returns to the email step and clears the pending reset session', async () => {
        const user = userEvent.setup();
        passwordResetSession.start('reset-back', { email: 'runner@example.com' });
        renderPasswordReset();

        await user.click(screen.getByRole('button', { name: 'Powrót' }));

        expect(screen.getByRole('heading', { name: 'Resetowanie hasła' })).toBeVisible();
        expect(screen.getByLabelText(/Email/)).toBeVisible();
        expect(passwordResetSession.id()).toBeNull();
        expect(passwordResetSession.step()).toBe(1);
    });
});
