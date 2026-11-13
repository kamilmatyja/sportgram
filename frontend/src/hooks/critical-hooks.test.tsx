import { describe, expect, it, vi } from 'vitest';
import { useDataTableState } from './useDataTableState';
import { useFormErrors } from './useFormErrors';
import { notifications } from '@mantine/notifications';
import { render, screen, userEvent } from '../test/test-utils';

function TableStateProbe() {
    const state = useDataTableState({ initialPage: 3, initialLimit: 20, initialSort: 'name:asc' });
    return (
        <div>
            <output>{`${state.page}/${state.limit}/${state.sort}`}</output>
            <button onClick={() => state.onLimitChange(5)}>limit</button>
            <button onClick={() => state.onSortChange('createdAt:desc')}>sort</button>
        </div>
    );
}

function FormErrorsProbe({
    showError,
}: {
    showError: (handle: ReturnType<typeof useFormErrors>['handleFormError']) => void;
}) {
    const { fieldErrors, handleFormError, clearFieldError } = useFormErrors();
    return (
        <div>
            <button onClick={() => showError(handleFormError)}>set error</button>
            <button onClick={() => clearFieldError('email')}>clear</button>
            <output>{fieldErrors.email ?? 'none'}</output>
        </div>
    );
}

describe('critical hooks', () => {
    it('resets pagination when page size or sorting changes', async () => {
        const user = userEvent.setup();
        render(<TableStateProbe />);
        expect(screen.getByText('3/20/name:asc')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'limit' }));
        expect(screen.getByText('1/5/name:asc')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'sort' }));
        expect(screen.getByText('1/5/createdAt:desc')).toBeVisible();
    });

    it('extracts and clears server validation errors', async () => {
        const user = userEvent.setup();
        const showError = vi.fn((handle: ReturnType<typeof useFormErrors>['handleFormError']) => {
            handle({ errors: [{ field: 'email', message: 'Nieprawidłowy adres' }] });
        });
        render(<FormErrorsProbe showError={showError} />);

        await user.click(screen.getByRole('button', { name: 'set error' }));
        expect(screen.getByText('Nieprawidłowy adres')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'clear' }));
        expect(screen.getByText('none')).toBeVisible();
    });

    it('sets only valid field errors without a redundant notification', async () => {
        const user = userEvent.setup();
        const showError = vi.fn((handle: ReturnType<typeof useFormErrors>['handleFormError']) => {
            handle(
                {
                    errors: [{ property: 'email', message: 'Invalid address' }, { message: 'Missing field key' }, null],
                },
                { notifyOnlyIfNoFields: true },
            );
        });
        const notification = vi.spyOn(notifications, 'show').mockImplementation(() => '');
        render(<FormErrorsProbe showError={showError} />);

        await user.click(screen.getByRole('button', { name: 'set error' }));

        expect(screen.getByText('Invalid address')).toBeVisible();
        expect(notification).not.toHaveBeenCalled();
    });

    it('notifies for a server error without field details when configured', async () => {
        const user = userEvent.setup();
        const showError = vi.fn((handle: ReturnType<typeof useFormErrors>['handleFormError']) => {
            handle({ message: 'Unexpected server error' }, { notifyOnlyIfNoFields: true });
        });
        const notification = vi.spyOn(notifications, 'show').mockImplementation(() => '');
        render(<FormErrorsProbe showError={showError} />);

        await user.click(screen.getByRole('button', { name: 'set error' }));

        expect(screen.getByText('none')).toBeVisible();
        expect(notification).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Unexpected server error', color: 'red' }),
        );
    });
});
