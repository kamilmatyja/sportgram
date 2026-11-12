import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../../api/services';
import { AuthVerificationStep } from './AuthVerificationStep';
import Login from './Login';
import Register from './Register';
import { render, screen, userEvent } from '../../test/test-utils';

describe('authentication UI', () => {
    beforeEach(() => {
        vi.spyOn(authService, 'sign').mockResolvedValue({ id: 'verification-1' } as never);
    });

    it('requires valid login fields and advances to the verification step on success', async () => {
        const user = userEvent.setup();
        render(<Login />, { initialEntries: ['/sign'] });

        expect(screen.getByRole('button', { name: 'Logowanie' })).toBeDisabled();
        await user.type(screen.getByLabelText(/Email/), 'runner@example.com');
        await user.type(screen.getByLabelText(/Hasło/), 'secret123');
        await user.click(screen.getByRole('button', { name: 'Logowanie' }));

        expect(authService.sign).toHaveBeenCalledWith({
            body: { email: 'runner@example.com', password: 'secret123' },
        });
        expect(await screen.findByRole('heading', { name: 'Logowanie – Weryfikacja' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Weryfikacja' })).toBeDisabled();
    });

    it('disables verification while loading and exposes back/resend actions', async () => {
        const user = userEvent.setup();
        const onBack = vi.fn();
        const onResend = vi.fn();
        render(
            <AuthVerificationStep
                code="123456"
                onCodeChange={vi.fn()}
                onSubmit={(event) => event.preventDefault()}
                onBack={onBack}
                onResend={onResend}
                loading={false}
                error="Nieprawidłowy kod"
            />,
        );

        expect(screen.getByText('Nieprawidłowy kod')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Weryfikacja' })).toBeEnabled();
        await user.click(screen.getByRole('button', { name: 'Powrót' }));
        await user.click(screen.getByRole('button', { name: 'Wyślij kod ponownie' }));
        expect(onBack).toHaveBeenCalledOnce();
        expect(onResend).toHaveBeenCalledOnce();
    });

    it('shows field-level API validation errors on login', async () => {
        const user = userEvent.setup();
        vi.spyOn(authService, 'sign').mockRejectedValue({
            errors: [{ field: 'email', message: 'Adres jest zablokowany' }],
        });
        render(<Login />, { initialEntries: ['/sign'] });

        await user.type(screen.getByLabelText(/Email/), 'blocked@example.com');
        await user.type(screen.getByLabelText(/Hasło/), 'secret123');
        await user.click(screen.getByRole('button', { name: 'Logowanie' }));

        expect(await screen.findByText('Adres jest zablokowany')).toBeVisible();
        expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-invalid', 'true');
    });

    it('starts password reset only after an email is entered', async () => {
        const user = userEvent.setup();
        vi.spyOn(authService, 'passwordReset').mockResolvedValue({ id: 'reset-1' } as never);
        const { default: PasswordReset } = await import('./PasswordReset');
        render(<PasswordReset />, { initialEntries: ['/password-reset'] });

        expect(screen.getByRole('button', { name: 'Wyślij' })).toBeDisabled();
        await user.type(screen.getByLabelText(/Email/), 'runner@example.com');
        await user.click(screen.getByRole('button', { name: 'Wyślij' }));

        expect(authService.passwordReset).toHaveBeenCalledWith({
            body: { email: 'runner@example.com' },
        });
        expect(await screen.findByRole('heading', { name: 'Resetowanie hasła – Weryfikacja' })).toBeVisible();
    });

    it('keeps registration disabled until required account fields are completed', () => {
        render(<Register />, { initialEntries: ['/register'] });

        expect(screen.getByRole('heading', { name: 'Rejestracja' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Rejestracja' })).toBeDisabled();
    });
});
