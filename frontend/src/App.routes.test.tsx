import { describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { authStorage } from './api/client';
import { feedService, storyService, userService } from './api/services';
import App from './App';
import { render, screen, userEvent } from './test/test-utils';

function LocationPath() {
    const location = useLocation();
    return <output aria-label="current location">{location.pathname}</output>;
}

describe('application routes', () => {
    it('shows the guest home actions and navigates to sign-in', async () => {
        const user = userEvent.setup();
        render(
            <>
                <App />
                <LocationPath />
            </>,
        );

        expect(screen.getByText('Witaj w Sportgram!')).toBeVisible();
        const signInButtons = screen.getAllByRole('button', { name: 'Logowanie' });
        await user.click(signInButtons[signInButtons.length - 1]);
        expect(screen.getByLabelText('current location')).toHaveTextContent('/sign');
    });

    it('redirects guests away from protected pages to sign-in', () => {
        render(
            <>
                <App />
                <LocationPath />
            </>,
            { initialEntries: ['/users'] },
        );

        expect(screen.getByLabelText('current location')).toHaveTextContent('/sign');
        expect(screen.getByRole('heading', { name: 'Logowanie' })).toBeVisible();
    });

    it('keeps a protected route in its loading state until the session is resolved', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        authStorage.save('test-token', 'test-sign', true);
        let resolveSession!: (value: { data: { id: string; link: string; roles: never[] }[] }) => void;
        vi.spyOn(userService, 'getUsers')
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveSession = resolve;
                    }) as never,
            )
            .mockResolvedValue({ data: [] } as never);

        render(
            <>
                <App />
                <LocationPath />
            </>,
            { initialEntries: ['/users'] },
        );

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        expect(screen.getByLabelText('current location')).toHaveTextContent('/users');
        expect(screen.queryByRole('heading', { name: 'Logowanie' })).not.toBeInTheDocument();

        await vi.waitFor(() => expect(resolveSession).toBeDefined());
        resolveSession({ data: [{ id: 'user-1', link: 'runner', roles: [] }] });

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByLabelText('current location')).toHaveTextContent('/users');
    });

    it('redirects signed-in users away from guest-only routes', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        authStorage.save('test-token', 'test-sign', true);
        vi.spyOn(userService, 'getUsers').mockResolvedValue({
            data: [{ id: 'user-1', link: 'runner', roles: [] }],
        } as never);
        vi.spyOn(feedService, 'getFeeds').mockResolvedValue({ data: [], pagination: { hasNextPage: false } } as never);
        vi.spyOn(storyService, 'getStories').mockResolvedValue({
            data: [],
            pagination: { hasNextPage: false },
        } as never);

        render(
            <>
                <App />
                <LocationPath />
            </>,
            { initialEntries: ['/sign'] },
        );

        expect(await screen.findByLabelText('current location')).toHaveTextContent('/');
        expect(screen.queryByRole('heading', { name: 'Logowanie' })).not.toBeInTheDocument();
    });
});
