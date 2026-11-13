import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { openConfirmActionModal } from './confirmModal';
import { render, screen, userEvent, waitFor } from '../test/test-utils';

describe('openConfirmActionModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens the confirmation modal and invokes the confirm callback', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        render(<div />);

        act(() => {
            openConfirmActionModal({
                title: 'Potwierdzenie',
                message: 'Czy zapisać zmiany?',
                confirmLabel: 'Zatwierdź',
                onConfirm,
                onCancel,
            });
        });

        expect(await screen.findByRole('dialog', { name: 'Potwierdzenie' })).toBeVisible();
        expect(screen.getByText('Czy zapisać zmiany?')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zatwierdź' }));

        expect(onConfirm).toHaveBeenCalledOnce();
        expect(onCancel).not.toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Potwierdzenie' })).not.toBeInTheDocument());
    });

    it('invokes the cancel callback without confirming', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        render(<div />);

        act(() => {
            openConfirmActionModal({
                title: 'Potwierdzenie',
                confirmLabel: 'Zatwierdź',
                cancelLabel: 'Anuluj',
                onConfirm,
                onCancel,
                withCancelButton: true,
            });
        });

        await user.click(await screen.findByRole('button', { name: 'Anuluj' }));

        expect(onCancel).toHaveBeenCalledOnce();
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
