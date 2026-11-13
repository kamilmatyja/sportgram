import { afterEach, describe, expect, it } from 'vitest';
import { OfflineStatusBadge } from './OfflineStatusBadge';
import { act, render, screen } from '../../test/test-utils';

const originalOnlineDescriptor = Object.getOwnPropertyDescriptor(navigator, 'onLine');

function setNavigatorOnline(isOnline: boolean) {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: isOnline });
}

afterEach(() => {
    if (originalOnlineDescriptor) {
        Object.defineProperty(navigator, 'onLine', originalOnlineDescriptor);
    } else {
        Reflect.deleteProperty(navigator, 'onLine');
    }
});

describe('OfflineStatusBadge', () => {
    it('does not show a badge while online', () => {
        setNavigatorOnline(true);
        render(<OfflineStatusBadge />);

        expect(screen.queryByText('Tryb offline')).not.toBeInTheDocument();
    });

    it('shows a user-facing message while offline', () => {
        setNavigatorOnline(false);
        render(<OfflineStatusBadge />);

        expect(screen.getByText('Tryb offline')).toBeVisible();
    });

    it('updates the visible badge when the connection changes', async () => {
        setNavigatorOnline(false);
        render(<OfflineStatusBadge />);

        expect(screen.getByText('Tryb offline')).toBeVisible();

        setNavigatorOnline(true);
        await act(async () => {
            window.dispatchEvent(new Event('online'));
        });
        expect(screen.queryByText('Tryb offline')).not.toBeInTheDocument();

        setNavigatorOnline(false);
        await act(async () => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(screen.getByText('Tryb offline')).toBeVisible();
    });
});
